"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentationQueue = void 0;
const bull_1 = __importDefault(require("bull"));
const logger_1 = require("../utils/logger");
const database_1 = require("../utils/database");
const documentation_generator_service_1 = require("../services/documentation-generator.service");
exports.documentationQueue = new bull_1.default('documentation-jobs', {
    redis: process.env.REDIS_URL || 'redis://localhost:6379',
});
exports.documentationQueue.process('process', async (job) => {
    const { jobId, config } = job.data;
    try {
        await database_1.prisma.job.update({
            where: { id: jobId },
            data: { status: 'PROCESSING' },
        });
        const defaultConfig = {
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
        const result = await (0, documentation_generator_service_1.generateDocumentation)(jobId, defaultConfig, (progress) => {
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
        logger_1.logger.info('Documentation generation completed successfully', {
            jobId,
            generatedFiles: result.generatedFiles.length,
            qualityScore: result.docQualityScore,
            cost: result.processingCost
        });
        return result;
    }
    catch (error) {
        logger_1.logger.error('Documentation generation failed', { jobId, error });
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
exports.documentationQueue.on('completed', (job, result) => {
    logger_1.logger.info('Documentation job completed', {
        jobId: job.data.jobId,
        result: {
            files: result.generatedFiles.length,
            qualityScore: result.docQualityScore
        }
    });
});
exports.documentationQueue.on('failed', (job, err) => {
    logger_1.logger.error('Documentation job failed', {
        jobId: job.data.jobId,
        error: err.message
    });
});
exports.documentationQueue.on('stalled', (job) => {
    logger_1.logger.warn('Documentation job stalled', {
        jobId: job.data.jobId
    });
});
// Graceful shutdown
process.on('SIGTERM', async () => {
    logger_1.logger.info('Shutting down documentation queue...');
    await exports.documentationQueue.close();
});
exports.default = exports.documentationQueue;
//# sourceMappingURL=documentation.job.js.map