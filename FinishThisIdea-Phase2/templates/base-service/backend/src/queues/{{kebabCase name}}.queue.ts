import Bull from 'bull';
import { logger } from '../utils/logger';
import { {{pascalCase name}}Service } from '../services/{{kebabCase name}}.service';
import { JobData, JobResult } from '../types/{{kebabCase name}}.types';
import { updateJobStatus } from '../utils/job-status';
import { sendWebhook } from '../utils/webhook';

// Create queue instance
export const {{camelCase name}}Queue = new Bull<JobData>('{{kebabCase name}}', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
  defaultJobOptions: {
    removeOnComplete: {
      age: 24 * 3600, // 24 hours
      count: 100, // Keep last 100 jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // 7 days
    },
    attempts: {{retryAttempts}},
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Process jobs
{{camelCase name}}Queue.process({{queueConcurrency}}, async (job) => {
  const { id, data } = job.data;
  const service = new {{pascalCase name}}Service();
  
  try {
    logger.info(`Processing {{name}} job ${job.id}`, { jobId: id });
    
    // Update status to processing
    await updateJobStatus(id, 'processing', {
      startedAt: new Date(),
      attempt: job.attemptsMade + 1,
    });
    
    // Send webhook if configured
    if (data.webhookUrl) {
      await sendWebhook(data.webhookUrl, {
        event: 'job.started',
        jobId: id,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Report progress
    await job.progress(10);
    
    // Main processing logic
    const result = await service.process(data, {
      onProgress: async (percent: number, message?: string) => {
        await job.progress(percent);
        await updateJobStatus(id, 'processing', {
          progress: percent,
          currentStep: message,
        });
      },
    });
    
    // Update final status
    await updateJobStatus(id, 'completed', {
      completedAt: new Date(),
      result,
    });
    
    // Send completion webhook
    if (data.webhookUrl) {
      await sendWebhook(data.webhookUrl, {
        event: 'job.completed',
        jobId: id,
        result,
        timestamp: new Date().toISOString(),
      });
    }
    
    logger.info(`Completed {{name}} job ${job.id}`, { jobId: id });
    
    return result;
    
  } catch (error) {
    logger.error(`Failed to process {{name}} job ${job.id}`, {
      jobId: id,
      error: error.message,
      stack: error.stack,
    });
    
    // Update error status
    await updateJobStatus(id, 'failed', {
      failedAt: new Date(),
      error: {
        message: error.message,
        code: error.code || 'PROCESSING_ERROR',
        attempts: job.attemptsMade + 1,
      },
    });
    
    // Send failure webhook
    if (data.webhookUrl) {
      await sendWebhook(data.webhookUrl, {
        event: 'job.failed',
        jobId: id,
        error: {
          message: error.message,
          code: error.code,
        },
        timestamp: new Date().toISOString(),
      });
    }
    
    // Re-throw to trigger Bull's retry mechanism
    throw error;
  }
});

// Queue event handlers
{{camelCase name}}Queue.on('completed', (job, result) => {
  logger.info(`Job ${job.id} completed successfully`);
});

{{camelCase name}}Queue.on('failed', (job, err) => {
  logger.error(`Job ${job.id} failed:`, err);
});

{{camelCase name}}Queue.on('stalled', (job) => {
  logger.warn(`Job ${job.id} stalled and will be retried`);
});

{{camelCase name}}Queue.on('error', (error) => {
  logger.error('Queue error:', error);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Closing {{name}} queue...');
  await {{camelCase name}}Queue.close();
});

// Export queue methods
export const addJob = async (data: JobData, options?: Bull.JobOptions): Promise<Bull.Job<JobData>> => {
  return {{camelCase name}}Queue.add(data, {
    ...options,
    {{#if priority}}
    priority: {{priority}},
    {{/if}}
  });
};

export const getJob = async (jobId: string): Promise<Bull.Job<JobData> | null> => {
  return {{camelCase name}}Queue.getJob(jobId);
};

export const getJobCounts = async () => {
  return {{camelCase name}}Queue.getJobCounts();
};

export const clean = async (grace: number, status?: string) => {
  return {{camelCase name}}Queue.clean(grace, status);
};

export const pause = async () => {
  return {{camelCase name}}Queue.pause();
};

export const resume = async () => {
  return {{camelCase name}}Queue.resume();
};