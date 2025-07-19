"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uxOptimizerQueue = void 0;
const bull_1 = __importDefault(require("bull"));
const logger_1 = require("../utils/logger");
const database_1 = require("../utils/database");
const uxOptimizer_service_1 = require("../services/uxOptimizer.service");
exports.uxOptimizerQueue = new bull_1.default('uxOptimizer-jobs', {
    redis: process.env.REDIS_URL || 'redis://localhost:6379',
});
exports.uxOptimizerQueue.process('process', async (job) => {
    const { jobId, config } = job.data;
    try {
        await database_1.prisma.job.update({
            where: { id: jobId },
            data: { status: 'PROCESSING' }
        });
        const result = await (0, uxOptimizer_service_1.processUxOptimizer)(jobId, config || {}, (progress) => {
            job.progress(progress);
        });
        await database_1.prisma.job.update({
            where: { id: jobId },
            data: {
                status: 'COMPLETED',
                outputFileUrl: result.outputFileUrl,
                progress: 100,
                processingEndedAt: new Date()
            }
        });
        logger_1.logger.info('uxOptimizer completed', { jobId });
        return result;
    }
    catch (error) {
        logger_1.logger.error('uxOptimizer failed', { jobId, error });
        await database_1.prisma.job.update({
            where: { id: jobId },
            data: {
                status: 'FAILED',
                error: error instanceof Error ? error.message : 'Unknown error',
                processingEndedAt: new Date()
            }
        });
        throw error;
    }
});
exports.default = exports.uxOptimizerQueue;
//# sourceMappingURL=uxOptimizer.job.js.map