import Bull from 'bull';
import { logger } from '../utils/logger';
import { prisma } from '../utils/database';
import { generateTests, TestGenerationConfig } from '../services/test-generator.service';

export const testGenerationQueue = new Bull('test-generation-jobs', {
  redis: process.env.REDIS_URL || 'redis://localhost:6379',
});

interface TestGenerationJobData {
  jobId: string;
  config?: TestGenerationConfig;
}

testGenerationQueue.process('process', async (job) => {
  const { jobId, config } = job.data as TestGenerationJobData;
  
  try {
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'PROCESSING' },
    });

    const defaultConfig: TestGenerationConfig = {
      testTypes: ['unit', 'integration'],
      framework: 'jest',
      coverageTarget: 80,
      includeSnapshots: true,
      includeMocks: true,
      includePerformance: false,
      testDataGeneration: true,
      mutationTesting: false,
      ...config
    };

    const result = await generateTests(jobId, defaultConfig, (progress) => {
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

    logger.info('Test generation completed successfully', {
      jobId,
      totalTests: Object.values(result.generatedTests as any).reduce((a: number, b: number) => a + b, 0),
      coverage: result.estimatedCoverage,
      framework: result.testFramework,
      cost: result.processingCost
    });

    return result;

  } catch (error) {
    logger.error('Test generation failed', { jobId, error });
    
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
testGenerationQueue.on('completed', (job, result) => {
  logger.info('Test generation job completed', {
    jobId: job.data.jobId,
    result: {
      tests: Object.values(result.generatedTests as any).reduce((a: number, b: number) => a + b, 0),
      coverage: result.estimatedCoverage
    }
  });
});

testGenerationQueue.on('failed', (job, err) => {
  logger.error('Test generation job failed', {
    jobId: job.data.jobId,
    error: err.message
  });
});

testGenerationQueue.on('stalled', (job) => {
  logger.warn('Test generation job stalled', {
    jobId: job.data.jobId
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Shutting down test generation queue...');
  await testGenerationQueue.close();
});

export default testGenerationQueue;