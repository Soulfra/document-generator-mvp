import Bull from 'bull';
import { logger } from '../utils/logger';
import { prisma } from '../utils/database';
import { generateDocumentation, DocumentationConfig } from '../services/documentation-generator.service';

export const documentationQueue = new Bull('documentation-jobs', {
  redis: process.env.REDIS_URL || 'redis://localhost:6379',
});

interface DocumentationJobData {
  jobId: string;
  config?: DocumentationConfig;
}

documentationQueue.process('process', async (job) => {
  const { jobId, config } = job.data as DocumentationJobData;
  
  try {
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'PROCESSING' },
    });

    const defaultConfig: DocumentationConfig = {
      includeReadme: true,
      includeApiDocs: true,
      includeSetupGuide: true,
      includeExamples: true,
      includeChangelog: false,
      includeContributing: false,
      docStyle: 'professional',
      targetAudience: 'developers',
      ...config
    };

    const result = await generateDocumentation(jobId, defaultConfig, (progress) => {
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

    logger.info('Documentation generation completed successfully', {
      jobId,
      generatedFiles: result.generatedFiles.length,
      qualityScore: result.docQualityScore,
      cost: result.processingCost
    });

    return result;

  } catch (error) {
    logger.error('Documentation generation failed', { jobId, error });
    
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
documentationQueue.on('completed', (job, result) => {
  logger.info('Documentation job completed', {
    jobId: job.data.jobId,
    result: {
      files: result.generatedFiles.length,
      qualityScore: result.docQualityScore
    }
  });
});

documentationQueue.on('failed', (job, err) => {
  logger.error('Documentation job failed', {
    jobId: job.data.jobId,
    error: err.message
  });
});

documentationQueue.on('stalled', (job) => {
  logger.warn('Documentation job stalled', {
    jobId: job.data.jobId
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Shutting down documentation queue...');
  await documentationQueue.close();
});

export default documentationQueue;