import Bull from 'bull';
import { logger } from '../utils/logger';
import { prisma } from '../utils/database';
import { processWorkflowAutomation, WorkflowAutomationConfig } from '../services/workflowAutomation.service';

export const workflowAutomationQueue = new Bull('workflowAutomation-jobs', {
  redis: process.env.REDIS_URL || 'redis://localhost:6379',
});

interface JobData {
  jobId: string;
  config?: WorkflowAutomationConfig;
}

workflowAutomationQueue.process('process', async (job) => {
  const { jobId, config } = job.data as JobData;
  
  try {
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'PROCESSING' }
    });

    const result = await processWorkflowAutomation(jobId, config || {}, (progress) => {
      job.progress(progress);
    });

    await prisma.job.update({
      where: { id: jobId },
      data: { 
        status: 'COMPLETED',
        outputFileUrl: result.outputFileUrl,
        progress: 100,
        processingEndedAt: new Date()
      }
    });

    logger.info('workflowAutomation completed', { jobId });
    return result;

  } catch (error) {
    logger.error('workflowAutomation failed', { jobId, error });
    await prisma.job.update({
      where: { id: jobId },
      data: { 
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
        processingEndedAt: new Date()
      }
    });
    throw error;
  }
});

export default workflowAutomationQueue;
