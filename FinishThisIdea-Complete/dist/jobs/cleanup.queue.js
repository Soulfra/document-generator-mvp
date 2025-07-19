"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupQueue = void 0;
const bull_1 = __importDefault(require("bull"));
const logger_1 = require("../utils/logger");
const database_1 = require("../utils/database");
const cleanup_service_1 = require("../services/cleanup.service");
exports.cleanupQueue = new bull_1.default('cleanup-jobs', {
    redis: process.env.REDIS_URL || 'redis://localhost:6379',
    defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
    },
});
exports.cleanupQueue.process(async (job) => {
    const { jobId } = job.data;
    logger_1.logger.info('Processing cleanup job', { jobId, attemptNumber: job.attemptsMade + 1 });
    try {
        await database_1.prisma.job.update({
            where: { id: jobId },
            data: {
                status: 'PROCESSING',
                processingStartedAt: new Date(),
            },
        });
        const result = await (0, cleanup_service_1.processCleanupJob)(jobId, (progress) => {
            job.progress(progress);
        });
        await database_1.prisma.job.update({
            where: { id: jobId },
            data: {
                status: 'COMPLETED',
                outputFileUrl: result.outputFileUrl,
                processingEndedAt: new Date(),
                metadata: result.metadata,
            },
        });
        logger_1.logger.info('Cleanup job completed', { jobId });
        return result;
    }
    catch (error) {
        logger_1.logger.error('Cleanup job failed', { jobId, error });
        await database_1.prisma.job.update({
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
exports.cleanupQueue.on('completed', (job, result) => {
    logger_1.logger.info('Job completed', {
        jobId: job.data.jobId,
        duration: job.finishedOn ? job.finishedOn - job.processedOn : 0
    });
});
exports.cleanupQueue.on('failed', (job, err) => {
    logger_1.logger.error('Job failed', {
        jobId: job.data.jobId,
        error: err.message,
        attemptNumber: job.attemptsMade,
    });
});
exports.cleanupQueue.on('progress', (job, progress) => {
    logger_1.logger.debug('Job progress', { jobId: job.data.jobId, progress });
    database_1.prisma.job.update({
        where: { id: job.data.jobId },
        data: { progress },
    }).catch(err => {
        logger_1.logger.error('Failed to update job progress', { error: err });
    });
});
setInterval(async () => {
    try {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        await exports.cleanupQueue.clean(24 * 60 * 60 * 1000, 'completed');
        await exports.cleanupQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed');
        logger_1.logger.debug('Queue cleanup completed');
    }
    catch (error) {
        logger_1.logger.error('Queue cleanup failed', { error });
    }
}, 60 * 60 * 1000);
//# sourceMappingURL=cleanup.queue.js.map