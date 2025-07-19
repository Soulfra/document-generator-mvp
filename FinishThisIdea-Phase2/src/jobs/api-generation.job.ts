import Bull from 'bull';
import { logger } from '../utils/logger';
import { prisma } from '../utils/database';
import { generateAPI, ApiGenerationConfig } from '../services/api-generator.service';

export const apiGenerationQueue = new Bull('api-generation-jobs', {
  redis: process.env.REDIS_URL || 'redis://localhost:6379',
});

interface ApiGenerationJobData {
  jobId: string;
  config?: ApiGenerationConfig;
}

apiGenerationQueue.process('process', async (job) => {
  const { jobId, config } = job.data as ApiGenerationJobData;
  
  try {
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'PROCESSING' },
    });

    const defaultConfig: ApiGenerationConfig = {
      apiType: 'rest',
      authentication: 'jwt',
      includeValidation: true,
      includePagination: true,
      includeErrorHandling: true,
      includeOpenApiSpec: true,
      includeTests: true,
      framework: 'express',
      database: 'postgresql',
      generateSDK: false,
      ...config
    };

    const result = await generateAPI(jobId, defaultConfig, (progress) => {
      job.progress(progress);
    });

    await prisma.job.update({
      where: { id: jobId },
      data: { 
        status: 'COMPLETED',
        outputFileUrl: result.outputFileUrl,
        progress: 100,
        processingEndedAt: new Date()
      },
    });

    logger.info('API generation completed successfully', {
      jobId,
      endpointCount: result.endpointCount,
      modelCount: result.modelCount,
      cost: result.processingCost
    });

    return result;

  } catch (error) {
    logger.error('API generation failed', { jobId, error });
    
    await prisma.job.update({
      where: { id: jobId },
      data: { 
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
        processingEndedAt: new Date()
      },
    });

    throw error;
  }
});

// Job event handlers
apiGenerationQueue.on('completed', (job, result) => {
  logger.info('API generation job completed', {
    jobId: job.data.jobId,
    result: {
      endpoints: result.endpointCount,
      models: result.modelCount
    }
  });
});

apiGenerationQueue.on('failed', (job, err) => {
  logger.error('API generation job failed', {
    jobId: job.data.jobId,
    error: err.message
  });
});

apiGenerationQueue.on('stalled', (job) => {
  logger.warn('API generation job stalled', {
    jobId: job.data.jobId
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Shutting down API generation queue...');
  await apiGenerationQueue.close();
});

export default apiGenerationQueue;