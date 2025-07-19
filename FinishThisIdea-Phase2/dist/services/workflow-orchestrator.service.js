"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workflowOrchestrator = exports.WorkflowOrchestrator = exports.WORKFLOWS = void 0;
const logger_1 = require("../utils/logger");
const database_1 = require("../utils/database");
const uuid_1 = require("uuid");
// Import all job queues
const cleanup_job_1 = require("../jobs/cleanup.job");
const documentation_job_1 = require("../jobs/documentation.job");
const api_generation_job_1 = require("../jobs/api-generation.job");
const test_generation_job_1 = require("../jobs/test-generation.job");
const security_analysis_job_1 = require("../jobs/security-analysis.job");
const codeCleanup_job_1 = require("../jobs/codeCleanup.job");
const documentationGenerator_job_1 = require("../jobs/documentationGenerator.job");
const apiGenerator_job_1 = require("../jobs/apiGenerator.job");
const testGenerator_job_1 = require("../jobs/testGenerator.job");
const aiConductor_job_1 = require("../jobs/aiConductor.job");
// Pre-defined workflows
exports.WORKFLOWS = {
    'complete-transform': {
        id: 'complete-transform',
        name: 'Complete Transform',
        description: 'Full codebase transformation: Cleanup → Documentation → API → Tests',
        price: 1200,
        steps: [
            {
                service: 'cleanup',
                queue: cleanup_job_1.cleanupQueue
            },
            {
                service: 'documentation',
                queue: documentation_job_1.documentationQueue,
                dependsOn: ['cleanup']
            },
            {
                service: 'api-generation',
                queue: api_generation_job_1.apiGenerationQueue,
                dependsOn: ['cleanup']
            },
            {
                service: 'test-generation',
                queue: test_generation_job_1.testGenerationQueue,
                dependsOn: ['cleanup', 'api-generation']
            }
        ]
    },
    'enterprise-security': {
        id: 'enterprise-security',
        name: 'Enterprise Security Suite',
        description: 'Complete transformation with security analysis and hardening',
        price: 1900,
        steps: [
            {
                service: 'cleanup',
                queue: cleanup_job_1.cleanupQueue
            },
            {
                service: 'security-analysis',
                queue: security_analysis_job_1.securityAnalysisQueue,
                dependsOn: ['cleanup']
            },
            {
                service: 'documentation',
                queue: documentation_job_1.documentationQueue,
                dependsOn: ['cleanup']
            },
            {
                service: 'api-generation',
                queue: api_generation_job_1.apiGenerationQueue,
                dependsOn: ['cleanup', 'security-analysis']
            },
            {
                service: 'test-generation',
                queue: test_generation_job_1.testGenerationQueue,
                dependsOn: ['api-generation']
            }
        ]
    },
    'ai-powered-transform': {
        id: 'ai-powered-transform',
        name: 'AI-Powered Transform',
        description: 'Use AI Conductor to orchestrate the best transformation path',
        price: 2500,
        steps: [
            {
                service: 'ai-conductor',
                queue: aiConductor_job_1.aiConductorQueue,
                config: { analyzeFirst: true }
            },
            {
                service: 'code-cleanup',
                queue: codeCleanup_job_1.codeCleanupQueue,
                dependsOn: ['ai-conductor']
            },
            {
                service: 'documentation-generator',
                queue: documentationGenerator_job_1.documentationGeneratorQueue,
                dependsOn: ['code-cleanup']
            },
            {
                service: 'api-generator',
                queue: apiGenerator_job_1.apiGeneratorQueue,
                dependsOn: ['code-cleanup']
            },
            {
                service: 'test-generator',
                queue: testGenerator_job_1.testGeneratorQueue,
                dependsOn: ['api-generator']
            }
        ]
    }
};
class WorkflowOrchestrator {
    constructor() {
        this.activeWorkflows = new Map();
    }
    async executeWorkflow(workflowId, bundleId, inputFileUrl, userId) {
        const workflow = exports.WORKFLOWS[workflowId];
        if (!workflow) {
            throw new Error(`Workflow ${workflowId} not found`);
        }
        logger_1.logger.info('Starting workflow execution', { workflowId, bundleId });
        const execution = new WorkflowExecution(workflow, bundleId, inputFileUrl, userId);
        this.activeWorkflows.set(bundleId, execution);
        try {
            await execution.start();
        }
        catch (error) {
            logger_1.logger.error('Workflow execution failed', { workflowId, bundleId, error });
            throw error;
        }
        finally {
            this.activeWorkflows.delete(bundleId);
        }
    }
    getWorkflowStatus(bundleId) {
        const execution = this.activeWorkflows.get(bundleId);
        return execution ? execution.getStatus() : null;
    }
}
exports.WorkflowOrchestrator = WorkflowOrchestrator;
class WorkflowExecution {
    constructor(workflow, bundleId, inputFileUrl, userId) {
        this.workflow = workflow;
        this.bundleId = bundleId;
        this.inputFileUrl = inputFileUrl;
        this.userId = userId;
        this.completedSteps = new Set();
        this.stepJobs = new Map(); // service -> jobId
        this.status = 'pending';
        this.currentStep = null;
    }
    async start() {
        this.status = 'running';
        logger_1.logger.info('Workflow execution started', {
            workflowId: this.workflow.id,
            bundleId: this.bundleId
        });
        try {
            // Execute steps in dependency order
            for (const step of this.workflow.steps) {
                await this.executeStep(step);
            }
            this.status = 'completed';
            logger_1.logger.info('Workflow execution completed', {
                workflowId: this.workflow.id,
                bundleId: this.bundleId
            });
            // Update bundle status
            await database_1.prisma.bundle.update({
                where: { id: this.bundleId },
                data: { status: 'COMPLETED' }
            });
        }
        catch (error) {
            this.status = 'failed';
            logger_1.logger.error('Workflow execution failed', {
                workflowId: this.workflow.id,
                bundleId: this.bundleId,
                error
            });
            // Update bundle status
            await database_1.prisma.bundle.update({
                where: { id: this.bundleId },
                data: { status: 'FAILED' }
            });
            throw error;
        }
    }
    async executeStep(step) {
        // Wait for dependencies
        if (step.dependsOn) {
            await this.waitForDependencies(step.dependsOn);
        }
        this.currentStep = step.service;
        logger_1.logger.info('Executing workflow step', {
            service: step.service,
            bundleId: this.bundleId
        });
        // Create job for this step
        const job = await database_1.prisma.job.create({
            data: {
                id: (0, uuid_1.v4)(),
                type: step.service.toUpperCase().replace(/-/g, '_'),
                status: 'PENDING',
                inputFileUrl: await this.getInputForStep(step),
                userId: this.userId,
                bundleId: this.bundleId,
                metadata: {
                    workflowId: this.workflow.id,
                    step: step.service,
                    config: step.config || {}
                }
            }
        });
        this.stepJobs.set(step.service, job.id);
        // Add job to queue
        await step.queue.add('process', {
            jobId: job.id,
            config: step.config || {}
        });
        // Wait for job completion
        await this.waitForJobCompletion(job.id);
        this.completedSteps.add(step.service);
        logger_1.logger.info('Workflow step completed', {
            service: step.service,
            bundleId: this.bundleId
        });
    }
    async waitForDependencies(dependencies) {
        const maxWaitTime = 30 * 60 * 1000; // 30 minutes
        const checkInterval = 5000; // 5 seconds
        const startTime = Date.now();
        while (true) {
            const allCompleted = dependencies.every(dep => this.completedSteps.has(dep));
            if (allCompleted) {
                break;
            }
            if (Date.now() - startTime > maxWaitTime) {
                throw new Error(`Timeout waiting for dependencies: ${dependencies.join(', ')}`);
            }
            await new Promise(resolve => setTimeout(resolve, checkInterval));
        }
    }
    async getInputForStep(step) {
        // If this step has dependencies, use the output from the last dependency
        if (step.dependsOn && step.dependsOn.length > 0) {
            const lastDependency = step.dependsOn[step.dependsOn.length - 1];
            const dependencyJobId = this.stepJobs.get(lastDependency);
            if (dependencyJobId) {
                const dependencyJob = await database_1.prisma.job.findUnique({
                    where: { id: dependencyJobId }
                });
                if (dependencyJob?.outputFileUrl) {
                    return dependencyJob.outputFileUrl;
                }
            }
        }
        // Otherwise use the original input
        return this.inputFileUrl;
    }
    async waitForJobCompletion(jobId) {
        const maxWaitTime = 30 * 60 * 1000; // 30 minutes
        const checkInterval = 5000; // 5 seconds
        const startTime = Date.now();
        while (true) {
            const job = await database_1.prisma.job.findUnique({
                where: { id: jobId }
            });
            if (!job) {
                throw new Error(`Job ${jobId} not found`);
            }
            if (job.status === 'COMPLETED') {
                break;
            }
            if (job.status === 'FAILED') {
                throw new Error(`Job ${jobId} failed: ${job.error}`);
            }
            if (Date.now() - startTime > maxWaitTime) {
                throw new Error(`Timeout waiting for job ${jobId}`);
            }
            await new Promise(resolve => setTimeout(resolve, checkInterval));
        }
    }
    getStatus() {
        const totalSteps = this.workflow.steps.length;
        const completedCount = this.completedSteps.size;
        const progress = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;
        return {
            bundleId: this.bundleId,
            workflowId: this.workflow.id,
            status: this.status,
            completedSteps: Array.from(this.completedSteps),
            currentStep: this.currentStep,
            progress
        };
    }
}
// Export singleton instance
exports.workflowOrchestrator = new WorkflowOrchestrator();
//# sourceMappingURL=workflow-orchestrator.service.js.map