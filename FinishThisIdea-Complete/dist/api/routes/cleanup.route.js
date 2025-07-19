"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupRouter = void 0;
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const uuid_1 = require("uuid");
const database_1 = require("../../utils/database");
const logger_1 = require("../../utils/logger");
const async_handler_1 = require("../../utils/async-handler");
const cleanup_queue_1 = require("../../jobs/cleanup.queue");
const storage_1 = require("../../utils/storage");
const payment_service_1 = require("../../services/payment.service");
const trust_tier_middleware_1 = require("../../middleware/trust-tier.middleware");
const errors_1 = require("../../utils/errors");
const router = express_1.default.Router();
exports.cleanupRouter = router;
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
        const allowedTypes = [
            'application/zip',
            'application/x-zip-compressed',
            'application/x-tar',
            'application/gzip',
            'application/x-gzip'
        ];
        const isZipFile = allowedTypes.includes(file.mimetype) ||
            file.originalname.toLowerCase().endsWith('.zip') ||
            file.originalname.toLowerCase().endsWith('.tar.gz') ||
            file.originalname.toLowerCase().endsWith('.tgz');
        if (isZipFile) {
            cb(null, true);
        }
        else {
            cb(new Error('Only ZIP and TAR files are allowed'));
        }
    }
});
router.post('/upload', (0, trust_tier_middleware_1.trustTierRateLimit)(), (0, trust_tier_middleware_1.trustTierCheck)(), upload.single('file'), (0, trust_tier_middleware_1.trustTierFileValidation)(), (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'NO_FILE',
                message: 'No file uploaded'
            }
        });
    }
    const file = req.file;
    const jobId = (0, uuid_1.v4)();
    const s3Key = `uploads/${jobId}/${file.originalname}`;
    try {
        const uploadResult = await (0, storage_1.uploadToS3)(file.buffer, s3Key, file.mimetype);
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        const userId = req.user?.id || req.body?.userId;
        const trustTier = req.trustTier || 'BRONZE';
        const trustFeatures = req.trustFeatures;
        const job = await database_1.prisma.job.create({
            data: {
                id: jobId,
                status: 'PENDING',
                inputFileUrl: uploadResult,
                originalFileName: file.originalname,
                fileSizeBytes: file.size,
                expiresAt,
                userId: userId || null,
                metadata: {
                    uploadedAt: new Date().toISOString(),
                    fileType: file.mimetype,
                    s3Key,
                    trustTier,
                    sessionId: req.headers['x-session-id'] || `session-${jobId}`
                }
            }
        });
        logger_1.logger.info('File uploaded successfully', {
            jobId,
            fileName: file.originalname,
            fileSize: file.size,
            s3Key
        });
        res.json({
            success: true,
            data: {
                jobId: job.id,
                originalFileName: job.originalFileName,
                fileSize: job.fileSizeBytes,
                status: job.status,
                uploadedAt: job.createdAt,
                trustTier,
                backupRetentionDays: trustFeatures?.backupRetentionDays || 7
            }
        });
    }
    catch (error) {
        const appError = (0, errors_1.handleError)(error);
        logger_1.logger.error('Upload failed', { error: (0, errors_1.getErrorMessage)(error), jobId });
        res.status(appError.statusCode).json({
            success: false,
            error: {
                code: appError.code || 'UPLOAD_FAILED',
                message: appError.message
            }
        });
    }
}));
router.post('/payment/checkout', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { jobId } = req.body;
    if (!jobId) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'MISSING_JOB_ID',
                message: 'Job ID is required'
            }
        });
    }
    try {
        const job = await database_1.prisma.job.findUnique({
            where: { id: jobId }
        });
        if (!job) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'JOB_NOT_FOUND',
                    message: 'Job not found'
                }
            });
        }
        if (job.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_STATUS',
                    message: 'Job is not in pending status'
                }
            });
        }
        const session = await (0, payment_service_1.createStripeSession)({
            jobId,
            amount: 100,
            currency: 'usd',
            description: `Codebase cleanup for ${job.originalFileName}`
        });
        await database_1.prisma.job.update({
            where: { id: jobId },
            data: {
                stripeSessionId: session.id
            }
        });
        await database_1.prisma.payment.create({
            data: {
                jobId,
                amount: 100,
                currency: 'usd',
                status: 'PENDING'
            }
        });
        logger_1.logger.info('Payment session created', { jobId, sessionId: session.id });
        res.json({
            success: true,
            data: {
                checkoutUrl: session.url,
                sessionId: session.id
            }
        });
    }
    catch (error) {
        const appError = (0, errors_1.handleError)(error);
        logger_1.logger.error('Payment setup failed', { error: (0, errors_1.getErrorMessage)(error), jobId });
        res.status(appError.statusCode).json({
            success: false,
            error: {
                code: appError.code || 'PAYMENT_FAILED',
                message: appError.message
            }
        });
    }
}));
router.get('/jobs/:jobId', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { jobId } = req.params;
    try {
        const job = await database_1.prisma.job.findUnique({
            where: { id: jobId },
            include: {
                payment: true,
                analysisResult: true
            }
        });
        if (!job) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'JOB_NOT_FOUND',
                    message: 'Job not found'
                }
            });
        }
        let downloadUrl = null;
        if (job.status === 'COMPLETED' && job.outputFileUrl) {
            try {
                const s3Key = job.outputFileUrl.replace(`s3://${process.env.S3_BUCKET}/`, '');
                downloadUrl = await (0, storage_1.generatePresignedUrl)(s3Key, 3600);
            }
            catch (error) {
                logger_1.logger.error('Failed to generate download URL', { jobId, error: (0, errors_1.getErrorMessage)(error) });
            }
        }
        const response = {
            id: job.id,
            status: job.status,
            progress: job.progress,
            originalFileName: job.originalFileName,
            fileSizeBytes: job.fileSizeBytes,
            createdAt: job.createdAt,
            processingStartedAt: job.processingStartedAt,
            processingEndedAt: job.processingEndedAt,
            error: job.error,
            downloadUrl,
            payment: job.payment ? {
                status: job.payment.status,
                amount: job.payment.amount,
                currency: job.payment.currency
            } : null,
            results: job.analysisResult ? {
                totalFiles: job.analysisResult.totalFiles,
                linesOfCode: job.analysisResult.linesOfCode,
                languages: job.analysisResult.languages,
                processingCost: job.analysisResult.processingCostUsd,
                claudeUsed: job.analysisResult.claudeUsed
            } : null
        };
        res.json({
            success: true,
            data: response
        });
    }
    catch (error) {
        const appError = (0, errors_1.handleError)(error);
        logger_1.logger.error('Failed to get job status', { error: (0, errors_1.getErrorMessage)(error), jobId });
        return res.status(appError.statusCode).json({
            success: false,
            error: {
                code: appError.code || 'STATUS_FAILED',
                message: appError.message
            }
        });
    }
}));
router.get('/jobs/:jobId/download', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { jobId } = req.params;
    try {
        const job = await database_1.prisma.job.findUnique({
            where: { id: jobId }
        });
        if (!job) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'JOB_NOT_FOUND',
                    message: 'Job not found'
                }
            });
        }
        if (job.status !== 'COMPLETED') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'JOB_NOT_COMPLETED',
                    message: 'Job is not completed yet'
                }
            });
        }
        if (!job.outputFileUrl) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NO_OUTPUT_FILE',
                    message: 'No output file available'
                }
            });
        }
        const s3Key = job.outputFileUrl.replace(`s3://${process.env.S3_BUCKET}/`, '');
        const downloadUrl = await (0, storage_1.generatePresignedUrl)(s3Key, 3600);
        res.redirect(downloadUrl);
    }
    catch (error) {
        const appError = (0, errors_1.handleError)(error);
        logger_1.logger.error('Failed to download file', { error: (0, errors_1.getErrorMessage)(error), jobId });
        return res.status(appError.statusCode).json({
            success: false,
            error: {
                code: appError.code || 'DOWNLOAD_FAILED',
                message: appError.message
            }
        });
    }
}));
router.post('/jobs/:jobId/start', (0, trust_tier_middleware_1.trustTierCheck)({ feature: 'allowClaude' }), (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { jobId } = req.params;
    try {
        const job = await database_1.prisma.job.findUnique({
            where: { id: jobId },
            include: {
                payment: true
            }
        });
        if (!job) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'JOB_NOT_FOUND',
                    message: 'Job not found'
                }
            });
        }
        if (!job.payment || job.payment.status !== 'SUCCEEDED') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'PAYMENT_NOT_COMPLETED',
                    message: 'Payment must be completed before processing'
                }
            });
        }
        if (job.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_STATUS',
                    message: 'Job is not in pending status'
                }
            });
        }
        await database_1.prisma.job.update({
            where: { id: jobId },
            data: {
                status: 'PROCESSING',
                processingStartedAt: new Date(),
                progress: 5
            }
        });
        const priority = req.trustFeatures?.priorityProcessing ? 1 : 10;
        await cleanup_queue_1.cleanupQueue.add('cleanup-code', {
            jobId,
            inputFileUrl: job.inputFileUrl,
            originalFileName: job.originalFileName,
            contextProfileId: job.contextProfileId,
            trustTier: req.trustTier || 'BRONZE',
            allowClaude: req.trustFeatures?.allowClaude || false
        }, {
            delay: 1000,
            priority,
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 60000
            }
        });
        logger_1.logger.info('Job started processing', { jobId });
        res.json({
            success: true,
            data: {
                jobId,
                status: 'PROCESSING',
                message: 'Processing started'
            }
        });
    }
    catch (error) {
        const appError = (0, errors_1.handleError)(error);
        logger_1.logger.error('Failed to start job processing', { error: (0, errors_1.getErrorMessage)(error), jobId });
        return res.status(appError.statusCode).json({
            success: false,
            error: {
                code: appError.code || 'START_FAILED',
                message: appError.message
            }
        });
    }
}));
router.get('/jobs/:jobId/backups', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { jobId } = req.params;
    try {
        const job = await database_1.prisma.job.findUnique({
            where: { id: jobId }
        });
        if (!job) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'JOB_NOT_FOUND',
                    message: 'Job not found'
                }
            });
        }
        const backups = job.metadata?.backups || [];
        res.json({
            success: true,
            data: {
                jobId,
                backups: backups.filter((b) => new Date(b.expiresAt) > new Date())
            }
        });
    }
    catch (error) {
        const appError = (0, errors_1.handleError)(error);
        logger_1.logger.error('Failed to list backups', { error: (0, errors_1.getErrorMessage)(error), jobId });
        return res.status(appError.statusCode).json({
            success: false,
            error: {
                code: appError.code || 'LIST_BACKUPS_FAILED',
                message: appError.message
            }
        });
    }
}));
router.get('/jobs', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { status, limit = 10, offset = 0 } = req.query;
    try {
        const where = status ? { status: status } : {};
        const jobs = await database_1.prisma.job.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit),
            skip: parseInt(offset),
            include: {
                payment: {
                    select: {
                        status: true,
                        amount: true,
                        currency: true
                    }
                },
                analysisResult: {
                    select: {
                        totalFiles: true,
                        linesOfCode: true,
                        languages: true,
                        processingCostUsd: true
                    }
                }
            }
        });
        const total = await database_1.prisma.job.count({ where });
        res.json({
            success: true,
            data: {
                jobs: jobs.map(job => ({
                    id: job.id,
                    status: job.status,
                    progress: job.progress,
                    originalFileName: job.originalFileName,
                    fileSizeBytes: job.fileSizeBytes,
                    createdAt: job.createdAt,
                    processingStartedAt: job.processingStartedAt,
                    processingEndedAt: job.processingEndedAt,
                    payment: job.payment,
                    results: job.analysisResult
                })),
                pagination: {
                    total,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: parseInt(offset) + parseInt(limit) < total
                }
            }
        });
    }
    catch (error) {
        const appError = (0, errors_1.handleError)(error);
        logger_1.logger.error('Failed to list jobs', { error: (0, errors_1.getErrorMessage)(error) });
        return res.status(appError.statusCode).json({
            success: false,
            error: {
                code: appError.code || 'LIST_FAILED',
                message: appError.message
            }
        });
    }
}));
//# sourceMappingURL=cleanup.route.js.map