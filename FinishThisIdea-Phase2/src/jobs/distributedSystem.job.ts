import Bull from 'bull';
import { logger } from '../utils/logger';
import { prisma } from '../utils/database';
import { processDistributedSystem, DistributedSystemConfig } from '../services/distributedSystem.service';

export const distributedSystemQueue = new Bull('distributedSystem-jobs', {
  redis: process.env.REDIS_URL || 'redis://localhost:6379',
});

interface JobData {
  jobId: string;
  config?: DistributedSystemConfig;
}

distributedSystemQueue.process('process', async (job) => {
  const { jobId, config } = job.data as JobData;
  
  try {
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'PROCESSING' }
    });

    const result = await processDistributedSystem(jobId, config || {}, (progress) => {
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

    logger.info('distributedSystem completed', { jobId });
    return result;

  } catch (error) {
    logger.error('distributedSystem failed', { jobId, error });
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

export default distributedSystemQueue;
