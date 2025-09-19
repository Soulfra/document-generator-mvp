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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiConductorIntegration = exports.AIConductorIntegration = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const logger_1 = require("../../utils/logger");
const events_1 = require("events");
const axios_1 = __importDefault(require("axios"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class AIConductorIntegration extends events_1.EventEmitter {
    config;
    conductorProcess = null;
    isRunning = false;
    apiBaseUrl;
    constructor(config) {
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
    async startConductor() {
        if (this.isRunning) {
            logger_1.logger.warn('AI Conductor already running');
            return;
        }
        try {
            logger_1.logger.info('Starting AI Conductor system', { config: this.config });
            const scriptExists = await this.checkScriptExists();
            if (!scriptExists) {
                throw new Error(`Conductor script not found: ${this.config.conductorScript}`);
            }
            this.conductorProcess = (0, child_process_1.spawn)(this.config.pythonPath, [
                this.config.conductorScript,
                '--api-port', this.config.apiPort.toString(),
                '--ws-port', this.config.webSocketPort.toString(),
                '--db-path', this.config.dbPath
            ], {
                stdio: ['ignore', 'pipe', 'pipe'],
                env: { ...process.env, PYTHONUNBUFFERED: '1' }
            });
            this.conductorProcess.stdout?.on('data', (data) => {
                const message = data.toString().trim();
                logger_1.logger.info('Conductor stdout', { message });
                this.emit('output', message);
            });
            this.conductorProcess.stderr?.on('data', (data) => {
                const error = data.toString().trim();
                logger_1.logger.warn('Conductor stderr', { error });
                this.emit('error', error);
            });
            this.conductorProcess.on('close', (code) => {
                logger_1.logger.info('Conductor process closed', { code });
                this.isRunning = false;
                this.emit('stopped', code);
            });
            this.conductorProcess.on('error', (error) => {
                logger_1.logger.error('Conductor process error', { error });
                this.isRunning = false;
                this.emit('error', error);
            });
            await this.waitForReady();
            this.isRunning = true;
            logger_1.logger.info('AI Conductor started successfully');
            this.emit('started');
        }
        catch (error) {
            logger_1.logger.error('Failed to start AI Conductor', { error });
            throw error;
        }
    }
    async stopConductor() {
        if (!this.isRunning || !this.conductorProcess) {
            logger_1.logger.warn('AI Conductor not running');
            return;
        }
        try {
            logger_1.logger.info('Stopping AI Conductor system');
            this.conductorProcess.kill('SIGTERM');
            setTimeout(() => {
                if (this.conductorProcess && !this.conductorProcess.killed) {
                    this.conductorProcess.kill('SIGKILL');
                }
            }, 5000);
            this.isRunning = false;
            this.conductorProcess = null;
            logger_1.logger.info('AI Conductor stopped');
            this.emit('stopped');
        }
        catch (error) {
            logger_1.logger.error('Error stopping AI Conductor', { error });
            throw error;
        }
    }
    async ingestConversation(request) {
        if (!this.isRunning) {
            throw new Error('AI Conductor not running');
        }
        try {
            const response = await axios_1.default.post(`${this.apiBaseUrl}/ingest`, {
                content: request.content,
                source: request.source,
                thread_id: request.threadId,
                user_id: request.userId,
                metadata: request.metadata,
                timestamp: new Date().toISOString()
            });
            logger_1.logger.info('Conversation ingested', {
                threadId: request.threadId,
                source: request.source,
                success: response.data.success
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to ingest conversation', { error, request });
            throw new Error('Failed to ingest conversation into AI Conductor');
        }
    }
    async generateThoughtChain(request) {
        if (!this.isRunning) {
            throw new Error('AI Conductor not running');
        }
        try {
            const response = await axios_1.default.post(`${this.apiBaseUrl}/thought-chain`, {
                goal: request.goal,
                context: request.context,
                max_depth: request.maxDepth,
                user_id: request.userId
            });
            const thoughts = response.data.thoughts || [];
            logger_1.logger.info('Thought chain generated', {
                goal: request.goal,
                nodeCount: thoughts.length,
                maxDepth: request.maxDepth
            });
            return this.formatThoughtNodes(thoughts);
        }
        catch (error) {
            logger_1.logger.error('Failed to generate thought chain', { error, request });
            throw new Error('Failed to generate thought chain');
        }
    }
    async getAIBuilders() {
        if (!this.isRunning) {
            throw new Error('AI Conductor not running');
        }
        try {
            const response = await axios_1.default.get(`${this.apiBaseUrl}/builders`);
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
        }
        catch (error) {
            logger_1.logger.error('Failed to get AI builders', { error });
            throw new Error('Failed to get AI builders');
        }
    }
    async orchestrateProject(projectId) {
        if (!this.isRunning) {
            throw new Error('AI Conductor not running');
        }
        try {
            const response = await axios_1.default.post(`${this.apiBaseUrl}/orchestrate`, {
                project_id: projectId
            });
            const result = response.data;
            logger_1.logger.info('Project orchestrated', {
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
        }
        catch (error) {
            logger_1.logger.error('Failed to orchestrate project', { error, projectId });
            throw new Error('Failed to orchestrate project');
        }
    }
    async getProjectStates() {
        if (!this.isRunning) {
            throw new Error('AI Conductor not running');
        }
        try {
            const response = await axios_1.default.get(`${this.apiBaseUrl}/projects`);
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
        }
        catch (error) {
            logger_1.logger.error('Failed to get project states', { error });
            throw new Error('Failed to get project states');
        }
    }
    async getConductorStatus() {
        if (!this.isRunning) {
            return { running: false, error: 'Conductor not started' };
        }
        try {
            const response = await axios_1.default.get(`${this.apiBaseUrl}/status`);
            return {
                running: true,
                ...response.data
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get conductor status', { error });
            return {
                running: false,
                error: 'Failed to connect to conductor API'
            };
        }
    }
    async checkScriptExists() {
        try {
            const { access } = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            await access(this.config.conductorScript);
            return true;
        }
        catch {
            return false;
        }
    }
    async waitForReady(timeout = 30000) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            try {
                const response = await axios_1.default.get(`${this.apiBaseUrl}/health`, {
                    timeout: 1000
                });
                if (response.status === 200) {
                    return;
                }
            }
            catch (error) {
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        throw new Error('AI Conductor failed to start within timeout period');
    }
    formatThoughtNodes(thoughts) {
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
    isRunning() {
        return this.isRunning;
    }
}
exports.AIConductorIntegration = AIConductorIntegration;
exports.aiConductorIntegration = new AIConductorIntegration();
//# sourceMappingURL=ai-conductor.integration.js.map