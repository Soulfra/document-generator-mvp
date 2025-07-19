"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentManager = exports.AgentManagerService = void 0;
const events_1 = require("events");
const logger_1 = require("../../utils/logger");
const code_analysis_agent_1 = require("./agents/code-analysis-agent");
const agent_registry_service_1 = require("./agent-registry.service");
const prometheus_metrics_service_1 = require("../monitoring/prometheus-metrics.service");
class AgentManagerService extends events_1.EventEmitter {
    agents = new Map();
    config;
    healthCheckTimer;
    constructor(config = {}) {
        super();
        this.config = {
            autoStart: true,
            autoScale: false,
            maxAgents: 10,
            scaleThreshold: 5,
            healthCheckInterval: 30000,
            ...config
        };
        if (this.config.autoStart) {
            this.autoStartAgents();
        }
        this.startHealthMonitoring();
    }
    async registerAgent(agent) {
        try {
            await agent.start();
            const agentId = agent.getId();
            this.agents.set(agentId, agent);
            agent.on('taskCompleted', (task, result) => {
                this.emit('agentTaskCompleted', agentId, task, result);
                prometheus_metrics_service_1.prometheusMetrics.recordAchievementUnlocked('agent_task_completed', 'orchestration');
            });
            agent.on('taskFailed', (task, error) => {
                this.emit('agentTaskFailed', agentId, task, error);
                logger_1.logger.warn('Agent task failed', { agentId, taskId: task.id, error });
            });
            agent.on('stopped', () => {
                this.agents.delete(agentId);
                this.emit('agentStopped', agentId);
            });
            logger_1.logger.info('Agent registered and started', {
                agentId,
                agentType: agent.getConfig().type,
                totalAgents: this.agents.size
            });
            this.emit('agentRegistered', agentId, agent);
            return agentId;
        }
        catch (error) {
            logger_1.logger.error('Failed to register agent', { error });
            throw error;
        }
    }
    async unregisterAgent(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            return false;
        }
        try {
            await agent.stop();
            this.agents.delete(agentId);
            logger_1.logger.info('Agent unregistered', { agentId });
            this.emit('agentUnregistered', agentId);
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to unregister agent', { agentId, error });
            return false;
        }
    }
    getAgent(agentId) {
        return this.agents.get(agentId);
    }
    listAgents() {
        return Array.from(this.agents.values());
    }
    getAgentsByType(type) {
        return Array.from(this.agents.values())
            .filter(agent => agent.getConfig().type === type);
    }
    getStats() {
        const agents = Array.from(this.agents.values());
        const agentsByType = agents.reduce((acc, agent) => {
            const type = agent.getConfig().type;
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});
        const activeAgents = agents.filter(agent => agent.getCurrentTask()).length;
        const idleAgents = agents.length - activeAgents;
        return {
            totalAgents: agents.length,
            agentsByType,
            activeAgents,
            idleAgents
        };
    }
    async autoStartAgents() {
        try {
            logger_1.logger.info('Auto-starting default agents');
            await this.registerAgent(code_analysis_agent_1.codeAnalysisAgent);
            logger_1.logger.info('Default agents started successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to auto-start agents', error);
        }
    }
    startHealthMonitoring() {
        this.healthCheckTimer = setInterval(() => {
            this.performHealthCheck();
            if (this.config.autoScale) {
                this.checkAutoScaling();
            }
        }, this.config.healthCheckInterval);
    }
    async performHealthCheck() {
        const agents = Array.from(this.agents.values());
        for (const agent of agents) {
            try {
                if (!agent.isAgentRunning()) {
                    logger_1.logger.warn('Agent is not running, attempting restart', {
                        agentId: agent.getId(),
                        agentType: agent.getConfig().type
                    });
                    await agent.start();
                }
            }
            catch (error) {
                logger_1.logger.error('Agent health check failed', {
                    agentId: agent.getId(),
                    error
                });
                this.agents.delete(agent.getId());
                this.emit('agentHealthCheckFailed', agent.getId(), error);
            }
        }
    }
    async checkAutoScaling() {
        try {
            const stats = agent_registry_service_1.agentRegistry.getStats();
            const queueLength = stats.tasks.queueLength;
            const currentAgents = this.agents.size;
            if (queueLength >= this.config.scaleThreshold && currentAgents < this.config.maxAgents) {
                logger_1.logger.info('Auto-scaling up agents', {
                    queueLength,
                    currentAgents,
                    maxAgents: this.config.maxAgents
                });
                const newAgent = new (await Promise.resolve().then(() => __importStar(require('./agents/code-analysis-agent')))).CodeAnalysisAgent();
                await this.registerAgent(newAgent);
                this.emit('agentScaledUp', newAgent.getId());
            }
            else if (queueLength === 0 && this.getStats().idleAgents > 1) {
                const idleAgents = Array.from(this.agents.values())
                    .filter(agent => !agent.getCurrentTask());
                if (idleAgents.length > 1) {
                    const agentToRemove = idleAgents[0];
                    await this.unregisterAgent(agentToRemove.getId());
                    logger_1.logger.info('Auto-scaling down agents', {
                        removedAgentId: agentToRemove.getId(),
                        remainingAgents: this.agents.size
                    });
                    this.emit('agentScaledDown', agentToRemove.getId());
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Auto-scaling check failed', error);
        }
    }
    async shutdown() {
        logger_1.logger.info('Shutting down agent manager');
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
        }
        const stopPromises = Array.from(this.agents.values()).map(agent => {
            return agent.stop().catch(error => {
                logger_1.logger.error('Failed to stop agent during shutdown', {
                    agentId: agent.getId(),
                    error
                });
            });
        });
        await Promise.allSettled(stopPromises);
        this.agents.clear();
        this.emit('shutdown');
        logger_1.logger.info('Agent manager shutdown complete');
    }
    getHealthStatus() {
        const agents = Array.from(this.agents.values());
        const healthyAgents = agents.filter(agent => agent.isAgentRunning()).length;
        const issues = [];
        if (agents.length === 0) {
            issues.push('No agents are running');
        }
        if (healthyAgents < agents.length) {
            issues.push(`${agents.length - healthyAgents} agents are unhealthy`);
        }
        let status;
        if (issues.length === 0) {
            status = 'healthy';
        }
        else if (healthyAgents > 0) {
            status = 'degraded';
        }
        else {
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
exports.AgentManagerService = AgentManagerService;
exports.agentManager = new AgentManagerService();
//# sourceMappingURL=agent-manager.service.js.map