"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testGenerationQueue = void 0;
const bull_1 = __importDefault(require("bull"));
const logger_1 = require("../utils/logger");
const database_1 = require("../utils/database");
const test_generator_service_1 = require("../services/test-generator.service");
exports.testGenerationQueue = new bull_1.default('test-generation-jobs', {
    redis: process.env.REDIS_URL || 'redis://localhost:6379',
});
exports.testGenerationQueue.process('process', async (job) => {
    const { jobId, config } = job.data;
    try {
        await database_1.prisma.job.update({
            where: { id: jobId },
            data: { status: 'PROCESSING' },
        });
        const defaultConfig = {
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
        const result = await (0, test_generator_service_1.generateTests)(jobId, defaultConfig, (progress) => {
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
        logger_1.logger.info('Test generation completed successfully', {
            jobId,
            totalTests: Object.values(result.generatedTests).reduce((a, b) => a + b, 0),
            coverage: result.estimatedCoverage,
            framework: result.testFramework,
            cost: result.processingCost
        });
        return result;
    }
    catch (error) {
        logger_1.logger.error('Test generation failed', { jobId, error });
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
exports.testGenerationQueue.on('completed', (job, result) => {
    logger_1.logger.info('Test generation job completed', {
        jobId: job.data.jobId,
        result: {
            tests: Object.values(result.generatedTests).reduce((a, b) => a + b, 0),
            coverage: result.estimatedCoverage
        }
    });
});
exports.testGenerationQueue.on('failed', (job, err) => {
    logger_1.logger.error('Test generation job failed', {
        jobId: job.data.jobId,
        error: err.message
    });
});
exports.testGenerationQueue.on('stalled', (job) => {
    logger_1.logger.warn('Test generation job stalled', {
        jobId: job.data.jobId
    });
});
// Graceful shutdown
process.on('SIGTERM', async () => {
    logger_1.logger.info('Shutting down test generation queue...');
    await exports.testGenerationQueue.close();
});
exports.default = exports.testGenerationQueue;
//# sourceMappingURL=test-generation.job.js.map