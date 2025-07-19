/**
 * Email Queue Service
 * Handles asynchronous email processing with Bull queue
 */

import Bull from 'bull';
import { EmailService, EmailOptions } from './email.service';
import { logger } from '../../utils/logger';
import { MetricsService } from '../monitoring/metrics.service';

export interface EmailJobData extends EmailOptions {
  priority?: number;
  attempts?: number;
  delay?: number;
  removeOnComplete?: boolean;
  removeOnFail?: boolean;
}

export class EmailQueueService {
  private queue: Bull.Queue<EmailJobData>;
  private emailService: EmailService;
  private metricsService: MetricsService;
  
  constructor() {
    this.emailService = new EmailService();
    this.metricsService = new MetricsService();
    
    // Initialize Bull queue
    this.queue = new Bull('email-queue', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD
      },
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      }
    });
    
    this.setupQueueHandlers();
    this.setupQueueEvents();
  }
  
  /**
   * Setup queue job processors
   */
  private setupQueueHandlers(): void {
    // Process email jobs
    this.queue.process('send-email', async (job) => {
      const { data } = job;
      
      logger.info('Processing email job', {
        jobId: job.id,
        template: data.template,
        to: data.to
      });
      
      try {
        const messageId = await this.emailService.sendEmail(data);
        
        // Record metrics
        this.metricsService.recordMetric({
          name: 'email.sent',
          value: 1,
          tags: {
            template: data.template,
            priority: data.priority?.toString() || 'normal'
          }
        });
        
        return { messageId, success: true };
      } catch (error) {
        logger.error('Error processing email job', {
          jobId: job.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        throw error;
      }
    });
    
    // Process batch emails
    this.queue.process('send-batch', async (job) => {
      const { emails } = job.data as any;
      const results = [];
      
      for (const email of emails) {
        try {
          const messageId = await this.emailService.sendEmail(email);
          results.push({ email: email.to, success: true, messageId });
        } catch (error) {
          results.push({ 
            email: email.to, 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      return results;
    });
  }
  
  /**
   * Setup queue event handlers
   */
  private setupQueueEvents(): void {
    // Job completed
    this.queue.on('completed', (job, result) => {
      logger.info('Email job completed', {
        jobId: job.id,
        result
      });
    });
    
    // Job failed
    this.queue.on('failed', (job, err) => {
      logger.error('Email job failed', {
        jobId: job.id,
        error: err.message,
        attempts: job.attemptsMade
      });
      
      this.metricsService.recordMetric({
        name: 'email.failed',
        value: 1,
        tags: {
          template: job.data.template,
          attemptsMade: job.attemptsMade.toString()
        }
      });
    });
    
    // Job stalled
    this.queue.on('stalled', (job) => {
      logger.warn('Email job stalled', {
        jobId: job.id
      });
    });
    
    // Queue error
    this.queue.on('error', (error) => {
      logger.error('Queue error', error);
    });
  }
  
  /**
   * Add email to queue
   */
  async queueEmail(emailData: EmailJobData): Promise<Bull.Job<EmailJobData>> {
    const jobOptions: Bull.JobOptions = {
      priority: emailData.priority || 0,
      attempts: emailData.attempts || 3,
      delay: emailData.delay || 0,
      removeOnComplete: emailData.removeOnComplete !== false,
      removeOnFail: emailData.removeOnFail || false
    };
    
    const job = await this.queue.add('send-email', emailData, jobOptions);
    
    logger.info('Email queued', {
      jobId: job.id,
      template: emailData.template,
      to: emailData.to
    });
    
    return job;
  }
  
  /**
   * Queue multiple emails
   */
  async queueBatch(emails: EmailJobData[]): Promise<Bull.Job> {
    const job = await this.queue.add('send-batch', { emails }, {
      priority: 1,
      attempts: 1
    });
    
    logger.info('Batch emails queued', {
      jobId: job.id,
      count: emails.length
    });
    
    return job;
  }
  
  /**
   * Queue high-priority email
   */
  async queuePriorityEmail(emailData: EmailJobData): Promise<Bull.Job<EmailJobData>> {
    return this.queueEmail({
      ...emailData,
      priority: 10
    });
  }
  
  /**
   * Queue delayed email
   */
  async queueDelayedEmail(
    emailData: EmailJobData, 
    delayMs: number
  ): Promise<Bull.Job<EmailJobData>> {
    return this.queueEmail({
      ...emailData,
      delay: delayMs
    });
  }
  
  /**
   * Queue welcome email sequence
   */
  async queueWelcomeSequence(userId: string, email: string, name: string): Promise<void> {
    // Immediate welcome email
    await this.queueEmail({
      to: email,
      template: 'welcome',
      data: { name, userId }
    });
    
    // Day 1: Getting started guide
    await this.queueDelayedEmail({
      to: email,
      template: 'getting-started',
      data: { name, userId }
    }, 24 * 60 * 60 * 1000); // 1 day
    
    // Day 3: Feature highlights
    await this.queueDelayedEmail({
      to: email,
      template: 'feature-highlights',
      data: { name, userId }
    }, 3 * 24 * 60 * 60 * 1000); // 3 days
    
    // Day 7: Check-in
    await this.queueDelayedEmail({
      to: email,
      template: 'check-in',
      data: { name, userId }
    }, 7 * 24 * 60 * 60 * 1000); // 7 days
  }
  
  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: boolean;
  }> {
    const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
      this.queue.isPaused()
    ]);
    
    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused
    };
  }
  
  /**
   * Clear completed jobs
   */
  async cleanQueue(): Promise<void> {
    await this.queue.clean(0, 'completed');
    await this.queue.clean(24 * 60 * 60 * 1000, 'failed'); // Clean failed jobs older than 24h
    
    logger.info('Queue cleaned');
  }
  
  /**
   * Pause queue processing
   */
  async pause(): Promise<void> {
    await this.queue.pause();
    logger.info('Email queue paused');
  }
  
  /**
   * Resume queue processing
   */
  async resume(): Promise<void> {
    await this.queue.resume();
    logger.info('Email queue resumed');
  }
  
  /**
   * Close queue connection
   */
  async close(): Promise<void> {
    await this.queue.close();
    logger.info('Email queue closed');
  }
  
  /**
   * Retry failed job
   */
  async retryJob(jobId: string): Promise<void> {
    const job = await this.queue.getJob(jobId);
    
    if (job && job.failedReason) {
      await job.retry();
      logger.info('Job retry initiated', { jobId });
    } else {
      throw new Error(`Job ${jobId} not found or not failed`);
    }
  }
  
  /**
   * Remove job from queue
   */
  async removeJob(jobId: string): Promise<void> {
    const job = await this.queue.getJob(jobId);
    
    if (job) {
      await job.remove();
      logger.info('Job removed', { jobId });
    } else {
      throw new Error(`Job ${jobId} not found`);
    }
  }
}