import Bull from 'bull';
import { logger } from '../utils/logger';
import { prisma } from '../utils/database';
import { processDeepCleanup, DeepCleanupConfig } from '../services/deepCleanup.service';

export const deepCleanupQueue = new Bull('deepCleanup-jobs', {
  redis: process.env.REDIS_URL || 'redis://localhost:6379',
});

interface JobData {
  jobId: string;
  config?: DeepCleanupConfig;
}

deepCleanupQueue.process('process', async (job) => {
  const { jobId, config } = job.data as JobData;
  
  try {
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'PROCESSING' }
    });

    const result = await processDeepCleanup(jobId, config || {}, (progress) => {
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

    logger.info('deepCleanup completed', { jobId });
    return result;

  } catch (error) {
    logger.error('deepCleanup failed', { jobId, error });
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

export default deepCleanupQueue;
