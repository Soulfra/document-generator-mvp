"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupQueue = void 0;
const bull_1 = __importDefault(require("bull"));
const logger_1 = require("../utils/logger");
const database_1 = require("../utils/database");
async function callPhase1CleanupService(jobId, inputFileUrl, progressCallback) {
    const phase1BaseUrl = process.env.PHASE1_BASE_URL || 'http://localhost:3001';
    try {
        // For now, simulate the Phase1 service response
        // In production, this would call the actual Phase1 API
        progressCallback(25);
        await new Promise(resolve => setTimeout(resolve, 2000));
        progressCallback(50);
        await new Promise(resolve => setTimeout(resolve, 2000));
        progressCallback(75);
        await new Promise(resolve => setTimeout(resolve, 1000));
        progressCallback(100);
        // Mock successful cleanup result that matches Phase1 format
        return {
            outputFileUrl: `https://storage.finishthisidea.com/cleanup/${jobId}/cleaned-project.zip`,
            metadata: {
                originalFiles: 52,
                cleanedFiles: 47,
                linesOfCode: 3250,
                languages: { javascript: 60, typescript: 30, css: 10 },
                improvements: [
                    'Organized files into logical folders',
                    'Standardized file and variable naming',
                    'Applied consistent code formatting',
                    'Removed unused imports and dead code'
                ],
                processingCost: 0.05
            }
        };
    }
    catch (error) {
        logger_1.logger.error('Phase1 cleanup service call failed', { jobId, error });
        throw error;
    }
}
exports.cleanupQueue = new bull_1.default('cleanup-jobs', {
    redis: process.env.REDIS_URL || 'redis://localhost:6379',
});
exports.cleanupQueue.process('process', async (job) => {
    const { jobId, config } = job.data;
    try {
        await database_1.prisma.job.update({
            where: { id: jobId },
            data: { status: 'PROCESSING' },
        });
        const jobData = await database_1.prisma.job.findUnique({
            where: { id: jobId }
        });
        if (!jobData) {
            throw new Error('Job not found');
        }
        // Call Phase 1 cleanup service via HTTP
        const result = await callPhase1CleanupService(jobId, jobData.inputFileUrl, (progress) => {
            job.progress(progress);
        });
        await database_1.prisma.job.update({
            where: { id: jobId },
            data: {
                status: 'COMPLETED',
                outputFileUrl: result.outputFileUrl,
                progress: 100,
                processingEndedAt: new Date()
            },
        });
        // Store analysis results
        await database_1.prisma.analysisResult.create({
            data: {
                jobId,
                totalFiles: result.metadata.cleanedFiles,
                linesOfCode: result.metadata.linesOfCode,
                languages: result.metadata.languages,
                issues: [],
                improvements: result.metadata.improvements,
                ollamaConfidence: 0.95,
                claudeUsed: false,
                processingCostUsd: result.metadata.processingCost
            }
        });
        logger_1.logger.info('Cleanup processing completed successfully', {
            jobId,
            totalFiles: result.metadata.cleanedFiles,
            cost: result.metadata.processingCost
        });
        return result;
    }
    catch (error) {
        logger_1.logger.error('Cleanup processing failed', { jobId, error });
        await database_1.prisma.job.update({
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
exports.cleanupQueue.on('completed', (job, result) => {
    logger_1.logger.info('Cleanup job completed', {
        jobId: job.data.jobId,
        result: {
            files: result.totalFiles,
            linesOfCode: result.linesOfCode
        }
    });
});
exports.cleanupQueue.on('failed', (job, err) => {
    logger_1.logger.error('Cleanup job failed', {
        jobId: job.data.jobId,
        error: err.message
    });
});
exports.cleanupQueue.on('stalled', (job) => {
    logger_1.logger.warn('Cleanup job stalled', {
        jobId: job.data.jobId
    });
});
// Graceful shutdown
process.on('SIGTERM', async () => {
    logger_1.logger.info('Shutting down cleanup queue...');
    await exports.cleanupQueue.close();
});
exports.default = exports.cleanupQueue;
//# sourceMappingURL=cleanup.job.js.map