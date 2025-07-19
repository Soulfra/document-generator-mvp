"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityAnalysisQueue = void 0;
const bull_1 = __importDefault(require("bull"));
const logger_1 = require("../utils/logger");
const database_1 = require("../utils/database");
const security_analyzer_service_1 = require("../services/security-analyzer.service");
exports.securityAnalysisQueue = new bull_1.default('security-analysis-jobs', {
    redis: process.env.REDIS_URL || 'redis://localhost:6379',
});
exports.securityAnalysisQueue.process('process', async (job) => {
    const { jobId, config } = job.data;
    try {
        await database_1.prisma.job.update({
            where: { id: jobId },
            data: { status: 'PROCESSING' },
        });
        const defaultConfig = {
            scanTypes: ['owasp', 'dependencies', 'secrets'],
            severityLevel: 'medium',
            includeCompliance: true,
            complianceStandards: ['soc2', 'gdpr'],
            generateReport: true,
            includeRemediation: true,
            scanDependencies: true,
            ...config
        };
        const result = await (0, security_analyzer_service_1.analyzeSecurityIssues)(jobId, defaultConfig, (progress) => {
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
        logger_1.logger.info('Security analysis completed successfully', {
            jobId,
            vulnerabilities: result.vulnerabilities,
            riskScore: result.riskScore,
            complianceScore: result.complianceScore,
            cost: result.processingCost
        });
        return result;
    }
    catch (error) {
        logger_1.logger.error('Security analysis failed', { jobId, error });
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
exports.securityAnalysisQueue.on('completed', (job, result) => {
    logger_1.logger.info('Security analysis job completed', {
        jobId: job.data.jobId,
        result: {
            riskScore: result.riskScore,
            totalVulnerabilities: Object.values(result.vulnerabilities).reduce((a, b) => a + b, 0)
        }
    });
});
exports.securityAnalysisQueue.on('failed', (job, err) => {
    logger_1.logger.error('Security analysis job failed', {
        jobId: job.data.jobId,
        error: err.message
    });
});
exports.securityAnalysisQueue.on('stalled', (job) => {
    logger_1.logger.warn('Security analysis job stalled', {
        jobId: job.data.jobId
    });
});
// Graceful shutdown
process.on('SIGTERM', async () => {
    logger_1.logger.info('Shutting down security analysis queue...');
    await exports.securityAnalysisQueue.close();
});
exports.default = exports.securityAnalysisQueue;
//# sourceMappingURL=security-analysis.job.js.map