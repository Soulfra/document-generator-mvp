import Bull from 'bull';
import { logger } from '../utils/logger';
import { prisma } from '../utils/database';
import { processCleanupJob } from '../services/cleanup.service';

// Create queue instance
export const cleanupQueue = new Bull('cleanup-jobs', {
  redis: process.env.REDIS_URL || 'redis://localhost:6379',
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50, // Keep last 50 failed jobs
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000, // Initial delay of 2 seconds
    },
  },
});

// Process jobs
cleanupQueue.process(async (job) => {
  const { jobId } = job.data;
  
  logger.info('Processing cleanup job', { jobId, attemptNumber: job.attemptsMade + 1 });

  try {
    // Update job status to processing
    await prisma.job.update({
      where: { id: jobId },
      data: { 
        status: 'PROCESSING',
        processingStartedAt: new Date(),
      },
    });

    // Process the cleanup
    const result = await processCleanupJob(jobId, (progress) => {
      job.progress(progress);
    });

    // Update job with results
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        outputFileUrl: result.outputFileUrl,
        processingEndedAt: new Date(),
        metadata: result.metadata,
      },
    });

    logger.info('Cleanup job completed', { jobId });
    return result;

  } catch (error) {
    logger.error('Cleanup job failed', { jobId, error });

    // Update job status to failed
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
        processingEndedAt: new Date(),
      },
    });

    throw error;
  }
});

// Queue event handlers
cleanupQueue.on('completed', (job, result) => {
  logger.info('Job completed', { 
    jobId: job.data.jobId, 
    duration: job.finishedOn ? job.finishedOn - job.processedOn! : 0 
  });
});

cleanupQueue.on('failed', (job, err) => {
  logger.error('Job failed', { 
    jobId: job.data.jobId, 
    error: err.message,
    attemptNumber: job.attemptsMade,
  });
});

cleanupQueue.on('progress', (job, progress) => {
  logger.debug('Job progress', { jobId: job.data.jobId, progress });
  
  // Update progress in database
  prisma.job.update({
    where: { id: job.data.jobId },
    data: { progress },
  }).catch(err => {
    logger.error('Failed to update job progress', { error: err });
  });
});

// Cleanup old jobs periodically
setInterval(async () => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Clean completed jobs
    await cleanupQueue.clean(24 * 60 * 60 * 1000, 'completed');
    
    // Clean failed jobs
    await cleanupQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed');
    
    logger.debug('Queue cleanup completed');
  } catch (error) {
    logger.error('Queue cleanup failed', { error });
  }
}, 60 * 60 * 1000); // Run every hour