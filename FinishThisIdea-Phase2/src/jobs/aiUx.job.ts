import Bull from 'bull';
import { logger } from '../utils/logger';
import { prisma } from '../utils/database';
import { processAiUx, AiUxConfig } from '../services/aiUx.service';

export const aiUxQueue = new Bull('aiUx-jobs', {
  redis: process.env.REDIS_URL || 'redis://localhost:6379',
});

interface JobData {
  jobId: string;
  config?: AiUxConfig;
}

aiUxQueue.process('process', async (job) => {
  const { jobId, config } = job.data as JobData;
  
  try {
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'PROCESSING' }
    });

    const result = await processAiUx(jobId, config || {}, (progress) => {
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

    logger.info('aiUx completed', { jobId });
    return result;

  } catch (error) {
    logger.error('aiUx failed', { jobId, error });
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

export default aiUxQueue;
