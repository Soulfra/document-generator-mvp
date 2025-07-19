"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobRouter = void 0;
const express_1 = require("express");
const database_1 = require("../../utils/database");
const storage_1 = require("../../utils/storage");
const errors_1 = require("../../utils/errors");
const logger_1 = require("../../utils/logger");
const prometheus_metrics_service_1 = require("../../services/monitoring/prometheus-metrics.service");
const router = (0, express_1.Router)();
router.get('/:jobId', async (req, res, next) => {
    try {
        const { jobId } = req.params;
        const job = await database_1.prisma.job.findUnique({
            where: { id: jobId },
            include: {
                payment: true,
                analysisResult: true,
            },
        });
        if (!job) {
            throw new errors_1.NotFoundError('Job not found');
        }
        const userTier = job.metadata?.userTier || 'FREE';
        prometheus_metrics_service_1.prometheusMetrics.recordJobCompleted(job.status, userTier);
        let downloadUrl = null;
        if (job.status === 'COMPLETED' && job.outputFileUrl) {
            try {
                const url = new URL(job.outputFileUrl);
                const s3Key = url.pathname.substring(1);
                downloadUrl = await (0, storage_1.generatePresignedUrl)(s3Key, 3600);
            }
            catch (error) {
                logger_1.logger.error('Failed to generate download URL', { jobId, error });
            }
        }
        const response = {
            success: true,
            data: {
                id: job.id,
                status: job.status,
                progress: job.progress,
                originalFileName: job.originalFileName,
                fileSizeBytes: job.fileSizeBytes,
                createdAt: job.createdAt,
                processingStartedAt: job.processingStartedAt,
                processingEndedAt: job.processingEndedAt,
                expiresAt: job.expiresAt,
                error: job.error,
                payment: job.payment ? {
                    status: job.payment.status,
                    amount: job.payment.amount,
                    currency: job.payment.currency,
                } : null,
                results: job.analysisResult ? {
                    totalFiles: job.analysisResult.totalFiles,
                    linesOfCode: job.analysisResult.linesOfCode,
                    languages: job.analysisResult.languages,
                    improvements: job.analysisResult.improvements,
                    processingCost: job.analysisResult.processingCostUsd,
                } : null,
                downloadUrl,
                nextSteps: getNextSteps(job, downloadUrl),
            },
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
});
router.get('/:jobId/download', async (req, res, next) => {
    try {
        const { jobId } = req.params;
        const job = await database_1.prisma.job.findUnique({
            where: { id: jobId },
        });
        if (!job) {
            throw new errors_1.NotFoundError('Job not found');
        }
        if (job.status !== 'COMPLETED') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'JOB_NOT_COMPLETED',
                    message: 'Job is not completed yet',
                    status: job.status,
                },
            });
        }
        if (!job.outputFileUrl) {
            return res.status(500).json({
                success: false,
                error: {
                    code: 'NO_OUTPUT_FILE',
                    message: 'Output file not available',
                },
            });
        }
        const url = new URL(job.outputFileUrl);
        const s3Key = url.pathname.substring(1);
        const downloadUrl = await (0, storage_1.generatePresignedUrl)(s3Key, 300);
        res.redirect(downloadUrl);
    }
    catch (error) {
        next(error);
    }
});
function getNextSteps(job, downloadUrl) {
    const steps = [];
    switch (job.status) {
        case 'PENDING':
            if (!job.payment || job.payment.status !== 'SUCCEEDED') {
                steps.push('Complete payment to start processing');
                steps.push('Check payment status periodically');
            }
            else {
                steps.push('Payment completed - processing will begin shortly');
            }
            break;
        case 'PROCESSING':
            steps.push('Your code is being cleaned and organized');
            steps.push('This usually takes 5-30 minutes depending on codebase size');
            steps.push('Check back periodically for updates');
            break;
        case 'COMPLETED':
            if (downloadUrl) {
                steps.push('Your cleaned codebase is ready for download');
                steps.push('The download link expires in 24 hours');
            }
            else {
                steps.push('Processing completed but download link unavailable');
                steps.push('Please contact support if this persists');
            }
            break;
        case 'FAILED':
            steps.push('Processing failed - please try uploading again');
            if (job.error) {
                steps.push(`Error: ${job.error}`);
            }
            break;
    }
    return steps;
}
exports.jobRouter = router;
//# sourceMappingURL=job.route.simple.js.map