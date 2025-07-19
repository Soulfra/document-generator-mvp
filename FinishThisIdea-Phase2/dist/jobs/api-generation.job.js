"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiGenerationQueue = void 0;
const bull_1 = __importDefault(require("bull"));
const logger_1 = require("../utils/logger");
const database_1 = require("../utils/database");
const api_generator_service_1 = require("../services/api-generator.service");
exports.apiGenerationQueue = new bull_1.default('api-generation-jobs', {
    redis: process.env.REDIS_URL || 'redis://localhost:6379',
});
exports.apiGenerationQueue.process('process', async (job) => {
    const { jobId, config } = job.data;
    try {
        await database_1.prisma.job.update({
            where: { id: jobId },
            data: { status: 'PROCESSING' },
        });
        const defaultConfig = {
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
        const result = await (0, api_generator_service_1.generateAPI)(jobId, defaultConfig, (progress) => {
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
        logger_1.logger.info('API generation completed successfully', {
            jobId,
            endpointCount: result.endpointCount,
            modelCount: result.modelCount,
            cost: result.processingCost
        });
        return result;
    }
    catch (error) {
        logger_1.logger.error('API generation failed', { jobId, error });
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
exports.apiGenerationQueue.on('completed', (job, result) => {
    logger_1.logger.info('API generation job completed', {
        jobId: job.data.jobId,
        result: {
            endpoints: result.endpointCount,
            models: result.modelCount
        }
    });
});
exports.apiGenerationQueue.on('failed', (job, err) => {
    logger_1.logger.error('API generation job failed', {
        jobId: job.data.jobId,
        error: err.message
    });
});
exports.apiGenerationQueue.on('stalled', (job) => {
    logger_1.logger.warn('API generation job stalled', {
        jobId: job.data.jobId
    });
});
// Graceful shutdown
process.on('SIGTERM', async () => {
    logger_1.logger.info('Shutting down API generation queue...');
    await exports.apiGenerationQueue.close();
});
exports.default = exports.apiGenerationQueue;
//# sourceMappingURL=api-generation.job.js.map