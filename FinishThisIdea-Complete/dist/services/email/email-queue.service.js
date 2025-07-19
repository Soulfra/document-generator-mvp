"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailQueueService = void 0;
const bull_1 = __importDefault(require("bull"));
const email_service_1 = require("./email.service");
const logger_1 = require("../../utils/logger");
const metrics_service_1 = require("../monitoring/metrics.service");
class EmailQueueService {
    queue;
    emailService;
    metricsService;
    constructor() {
        this.emailService = new email_service_1.EmailService();
        this.metricsService = new metrics_service_1.MetricsService();
        this.queue = new bull_1.default('email-queue', {
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
    setupQueueHandlers() {
        this.queue.process('send-email', async (job) => {
            const { data } = job;
            logger_1.logger.info('Processing email job', {
                jobId: job.id,
                template: data.template,
                to: data.to
            });
            try {
                const messageId = await this.emailService.sendEmail(data);
                this.metricsService.recordMetric({
                    name: 'email.sent',
                    value: 1,
                    tags: {
                        template: data.template,
                        priority: data.priority?.toString() || 'normal'
                    }
                });
                return { messageId, success: true };
            }
            catch (error) {
                logger_1.logger.error('Error processing email job', {
                    jobId: job.id,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
                throw error;
            }
        });
        this.queue.process('send-batch', async (job) => {
            const { emails } = job.data;
            const results = [];
            for (const email of emails) {
                try {
                    const messageId = await this.emailService.sendEmail(email);
                    results.push({ email: email.to, success: true, messageId });
                }
                catch (error) {
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
    setupQueueEvents() {
        this.queue.on('completed', (job, result) => {
            logger_1.logger.info('Email job completed', {
                jobId: job.id,
                result
            });
        });
        this.queue.on('failed', (job, err) => {
            logger_1.logger.error('Email job failed', {
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
        this.queue.on('stalled', (job) => {
            logger_1.logger.warn('Email job stalled', {
                jobId: job.id
            });
        });
        this.queue.on('error', (error) => {
            logger_1.logger.error('Queue error', error);
        });
    }
    async queueEmail(emailData) {
        const jobOptions = {
            priority: emailData.priority || 0,
            attempts: emailData.attempts || 3,
            delay: emailData.delay || 0,
            removeOnComplete: emailData.removeOnComplete !== false,
            removeOnFail: emailData.removeOnFail || false
        };
        const job = await this.queue.add('send-email', emailData, jobOptions);
        logger_1.logger.info('Email queued', {
            jobId: job.id,
            template: emailData.template,
            to: emailData.to
        });
        return job;
    }
    async queueBatch(emails) {
        const job = await this.queue.add('send-batch', { emails }, {
            priority: 1,
            attempts: 1
        });
        logger_1.logger.info('Batch emails queued', {
            jobId: job.id,
            count: emails.length
        });
        return job;
    }
    async queuePriorityEmail(emailData) {
        return this.queueEmail({
            ...emailData,
            priority: 10
        });
    }
    async queueDelayedEmail(emailData, delayMs) {
        return this.queueEmail({
            ...emailData,
            delay: delayMs
        });
    }
    async queueWelcomeSequence(userId, email, name) {
        await this.queueEmail({
            to: email,
            template: 'welcome',
            data: { name, userId }
        });
        await this.queueDelayedEmail({
            to: email,
            template: 'getting-started',
            data: { name, userId }
        }, 24 * 60 * 60 * 1000);
        await this.queueDelayedEmail({
            to: email,
            template: 'feature-highlights',
            data: { name, userId }
        }, 3 * 24 * 60 * 60 * 1000);
        await this.queueDelayedEmail({
            to: email,
            template: 'check-in',
            data: { name, userId }
        }, 7 * 24 * 60 * 60 * 1000);
    }
    async getQueueStats() {
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
    async cleanQueue() {
        await this.queue.clean(0, 'completed');
        await this.queue.clean(24 * 60 * 60 * 1000, 'failed');
        logger_1.logger.info('Queue cleaned');
    }
    async pause() {
        await this.queue.pause();
        logger_1.logger.info('Email queue paused');
    }
    async resume() {
        await this.queue.resume();
        logger_1.logger.info('Email queue resumed');
    }
    async close() {
        await this.queue.close();
        logger_1.logger.info('Email queue closed');
    }
    async retryJob(jobId) {
        const job = await this.queue.getJob(jobId);
        if (job && job.failedReason) {
            await job.retry();
            logger_1.logger.info('Job retry initiated', { jobId });
        }
        else {
            throw new Error(`Job ${jobId} not found or not failed`);
        }
    }
    async removeJob(jobId) {
        const job = await this.queue.getJob(jobId);
        if (job) {
            await job.remove();
            logger_1.logger.info('Job removed', { jobId });
        }
        else {
            throw new Error(`Job ${jobId} not found`);
        }
    }
}
exports.EmailQueueService = EmailQueueService;
//# sourceMappingURL=email-queue.service.js.map