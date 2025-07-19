import { logger } from '../utils/logger';
import { prisma } from '../utils/database';
import { v4 as uuidv4 } from 'uuid';
import Bull from 'bull';

// Import all job queues
import { cleanupQueue } from '../jobs/cleanup.job';
import { documentationQueue } from '../jobs/documentation.job';
import { apiGenerationQueue } from '../jobs/api-generation.job';
import { testGenerationQueue } from '../jobs/test-generation.job';
import { securityAnalysisQueue } from '../jobs/security-analysis.job';
import { codeCleanupQueue } from '../jobs/codeCleanup.job';
import { documentationGeneratorQueue } from '../jobs/documentationGenerator.job';
import { apiGeneratorQueue } from '../jobs/apiGenerator.job';
import { testGeneratorQueue } from '../jobs/testGenerator.job';
import { aiConductorQueue } from '../jobs/aiConductor.job';

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  price: number;
}

export interface WorkflowStep {
  service: string;
  queue: Bull.Queue;
  dependsOn?: string[];
  config?: any;
}

// Pre-defined workflows
export const WORKFLOWS: Record<string, WorkflowDefinition> = {
  'complete-transform': {
    id: 'complete-transform',
    name: 'Complete Transform',
    description: 'Full codebase transformation: Cleanup → Documentation → API → Tests',
    price: 1200,
    steps: [
      {
        service: 'cleanup',
        queue: cleanupQueue
      },
      {
        service: 'documentation',
        queue: documentationQueue,
        dependsOn: ['cleanup']
      },
      {
        service: 'api-generation',
        queue: apiGenerationQueue,
        dependsOn: ['cleanup']
      },
      {
        service: 'test-generation',
        queue: testGenerationQueue,
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
        queue: cleanupQueue
      },
      {
        service: 'security-analysis',
        queue: securityAnalysisQueue,
        dependsOn: ['cleanup']
      },
      {
        service: 'documentation',
        queue: documentationQueue,
        dependsOn: ['cleanup']
      },
      {
        service: 'api-generation',
        queue: apiGenerationQueue,
        dependsOn: ['cleanup', 'security-analysis']
      },
      {
        service: 'test-generation',
        queue: testGenerationQueue,
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
        queue: aiConductorQueue,
        config: { analyzeFirst: true }
      },
      {
        service: 'code-cleanup',
        queue: codeCleanupQueue,
        dependsOn: ['ai-conductor']
      },
      {
        service: 'documentation-generator',
        queue: documentationGeneratorQueue,
        dependsOn: ['code-cleanup']
      },
      {
        service: 'api-generator',
        queue: apiGeneratorQueue,
        dependsOn: ['code-cleanup']
      },
      {
        service: 'test-generator',
        queue: testGeneratorQueue,
        dependsOn: ['api-generator']
      }
    ]
  }
};

export class WorkflowOrchestrator {
  private activeWorkflows: Map<string, WorkflowExecution> = new Map();

  async executeWorkflow(
    workflowId: string,
    bundleId: string,
    inputFileUrl: string,
    userId: string
  ): Promise<void> {
    const workflow = WORKFLOWS[workflowId];
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    logger.info('Starting workflow execution', { workflowId, bundleId });

    const execution = new WorkflowExecution(workflow, bundleId, inputFileUrl, userId);
    this.activeWorkflows.set(bundleId, execution);

    try {
      await execution.start();
    } catch (error) {
      logger.error('Workflow execution failed', { workflowId, bundleId, error });
      throw error;
    } finally {
      this.activeWorkflows.delete(bundleId);
    }
  }

  getWorkflowStatus(bundleId: string): WorkflowStatus | null {
    const execution = this.activeWorkflows.get(bundleId);
    return execution ? execution.getStatus() : null;
  }
}

interface WorkflowStatus {
  bundleId: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  completedSteps: string[];
  currentStep: string | null;
  progress: number;
}

class WorkflowExecution {
  private completedSteps: Set<string> = new Set();
  private stepJobs: Map<string, string> = new Map(); // service -> jobId
  private status: 'pending' | 'running' | 'completed' | 'failed' = 'pending';
  private currentStep: string | null = null;

  constructor(
    private workflow: WorkflowDefinition,
    private bundleId: string,
    private inputFileUrl: string,
    private userId: string
  ) {}

  async start(): Promise<void> {
    this.status = 'running';
    logger.info('Workflow execution started', { 
      workflowId: this.workflow.id, 
      bundleId: this.bundleId 
    });

    try {
      // Execute steps in dependency order
      for (const step of this.workflow.steps) {
        await this.executeStep(step);
      }

      this.status = 'completed';
      logger.info('Workflow execution completed', { 
        workflowId: this.workflow.id, 
        bundleId: this.bundleId 
      });

      // Update bundle status
      await prisma.bundle.update({
        where: { id: this.bundleId },
        data: { status: 'COMPLETED' }
      });

    } catch (error) {
      this.status = 'failed';
      logger.error('Workflow execution failed', { 
        workflowId: this.workflow.id, 
        bundleId: this.bundleId,
        error 
      });

      // Update bundle status
      await prisma.bundle.update({
        where: { id: this.bundleId },
        data: { status: 'FAILED' }
      });

      throw error;
    }
  }

  private async executeStep(step: WorkflowStep): Promise<void> {
    // Wait for dependencies
    if (step.dependsOn) {
      await this.waitForDependencies(step.dependsOn);
    }

    this.currentStep = step.service;
    logger.info('Executing workflow step', { 
      service: step.service, 
      bundleId: this.bundleId 
    });

    // Create job for this step
    const job = await prisma.job.create({
      data: {
        id: uuidv4(),
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
    logger.info('Workflow step completed', { 
      service: step.service, 
      bundleId: this.bundleId 
    });
  }

  private async waitForDependencies(dependencies: string[]): Promise<void> {
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

  private async getInputForStep(step: WorkflowStep): Promise<string> {
    // If this step has dependencies, use the output from the last dependency
    if (step.dependsOn && step.dependsOn.length > 0) {
      const lastDependency = step.dependsOn[step.dependsOn.length - 1];
      const dependencyJobId = this.stepJobs.get(lastDependency);
      
      if (dependencyJobId) {
        const dependencyJob = await prisma.job.findUnique({
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

  private async waitForJobCompletion(jobId: string): Promise<void> {
    const maxWaitTime = 30 * 60 * 1000; // 30 minutes
    const checkInterval = 5000; // 5 seconds
    const startTime = Date.now();

    while (true) {
      const job = await prisma.job.findUnique({
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

  getStatus(): WorkflowStatus {
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
export const workflowOrchestrator = new WorkflowOrchestrator();