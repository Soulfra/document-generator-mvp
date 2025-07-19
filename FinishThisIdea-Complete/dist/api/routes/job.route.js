"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const database_1 = require("../../utils/database");
const cleanup_queue_1 = require("../../jobs/cleanup.queue");
const logger_1 = require("../../utils/logger");
const async_handler_1 = require("../../utils/async-handler");
const errors_1 = require("../../utils/errors");
const pricing_1 = require("../../utils/pricing");
const router = (0, express_1.Router)();
exports.jobRouter = router;
const createJobSchema = zod_1.z.object({
    uploadId: zod_1.z.string().uuid(),
    type: zod_1.z.enum(['cleanup', 'refactor', 'format', 'full']).default('cleanup'),
    profileId: zod_1.z.string().optional(),
    customProfile: zod_1.z.any().optional(),
    options: zod_1.z.object({
        removeComments: zod_1.z.boolean().default(false),
        removeConsoleLog: zod_1.z.boolean().default(true),
        formatCode: zod_1.z.boolean().default(true),
        optimizeImports: zod_1.z.boolean().default(true),
        removeDeadCode: zod_1.z.boolean().default(true),
        convertToTypeScript: zod_1.z.boolean().default(false),
        addTests: zod_1.z.boolean().default(false),
        llmProvider: zod_1.z.enum(['ollama', 'openai', 'anthropic', 'auto']).default('auto'),
    }).default({}),
});
const swipeDecisionSchema = zod_1.z.object({
    changeId: zod_1.z.string(),
    decision: zod_1.z.enum(['accept', 'reject', 'modify']),
    modifiedCode: zod_1.z.string().optional(),
});
const updateJobSchema = zod_1.z.object({
    decisions: zod_1.z.array(swipeDecisionSchema),
});
router.post('/', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const data = createJobSchema.parse(req.body);
    const upload = await database_1.prisma.upload.findFirst({
        where: {
            id: data.uploadId,
            userId,
            status: 'UPLOADED',
        },
    });
    if (!upload) {
        throw new errors_1.AppError('Upload not found or not accessible', 404, 'UPLOAD_NOT_FOUND');
    }
    const existingJob = await database_1.prisma.job.findFirst({
        where: {
            uploadId: data.uploadId,
            status: { in: ['PENDING', 'PROCESSING', 'REVIEW'] },
        },
    });
    if (existingJob) {
        throw new errors_1.AppError('A job is already in progress for this upload', 400, 'JOB_ALREADY_EXISTS');
    }
    const estimatedCost = (0, pricing_1.calculateCost)({
        fileSize: upload.size,
        type: data.type,
        options: data.options,
    });
    const job = await database_1.prisma.job.create({
        data: {
            userId,
            uploadId: data.uploadId,
            type: data.type,
            status: 'PENDING',
            input: {
                options: data.options,
                profileId: data.profileId,
                customProfile: data.customProfile,
                uploadInfo: {
                    filename: upload.originalName,
                    size: upload.size,
                    mimeType: upload.mimeType,
                },
            },
            cost: estimatedCost,
            metadata: {
                createdFrom: 'web',
                userAgent: req.headers['user-agent'],
            },
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
    });
    await cleanup_queue_1.cleanupQueue.add('process-cleanup', {
        jobId: job.id,
        userId,
        uploadId: data.uploadId,
        options: data.options,
        type: data.type,
    }, {
        priority: 1,
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
    });
    logger_1.logger.info('Job created and queued', {
        jobId: job.id,
        userId,
        uploadId: data.uploadId,
        type: data.type,
    });
    res.status(201).json({
        success: true,
        data: {
            id: job.id,
            type: job.type,
            status: job.status,
            estimatedCost,
            createdAt: job.createdAt,
            expiresAt: job.expiresAt,
        },
    });
}));
router.get('/', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const { status, limit = 20, offset = 0 } = req.query;
    const where = { userId };
    if (status) {
        where.status = status;
    }
    const [jobs, total] = await Promise.all([
        database_1.prisma.job.findMany({
            where,
            include: {
                upload: {
                    select: {
                        originalName: true,
                        size: true,
                    },
                },
                payment: {
                    select: {
                        status: true,
                        amount: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: Number(limit),
            skip: Number(offset),
        }),
        database_1.prisma.job.count({ where }),
    ]);
    res.json({
        success: true,
        data: jobs.map(job => ({
            id: job.id,
            type: job.type,
            status: job.status,
            progress: job.progress,
            cost: job.cost,
            filename: job.upload?.originalName,
            fileSize: job.upload?.size,
            paymentStatus: job.payment?.status,
            createdAt: job.createdAt,
            completedAt: job.completedAt,
        })),
        pagination: {
            total,
            limit: Number(limit),
            offset: Number(offset),
            hasMore: Number(offset) + Number(limit) < total,
        },
    });
}));
router.get('/:id', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const job = await database_1.prisma.job.findFirst({
        where: { id, userId },
        include: {
            upload: true,
            payment: true,
        },
    });
    if (!job) {
        throw new errors_1.AppError('Job not found', 404, 'JOB_NOT_FOUND');
    }
    let queueProgress = null;
    if (job.status === 'PROCESSING') {
        const queueJob = await cleanup_queue_1.cleanupQueue.getJob(id);
        if (queueJob) {
            queueProgress = await queueJob.progress();
        }
    }
    res.json({
        success: true,
        data: {
            id: job.id,
            type: job.type,
            status: job.status,
            progress: queueProgress || job.progress,
            currentStep: job.currentStep,
            input: job.input,
            changes: job.changes,
            decisions: job.decisions,
            cost: job.cost,
            tokensUsed: job.tokensUsed,
            llmProvider: job.llmProvider,
            outputUrl: job.outputUrl,
            downloadUrl: job.downloadUrl,
            error: job.error,
            upload: job.upload ? {
                id: job.upload.id,
                filename: job.upload.originalName,
                size: job.upload.size,
            } : null,
            payment: job.payment ? {
                id: job.payment.id,
                status: job.payment.status,
                amount: job.payment.amount,
            } : null,
            createdAt: job.createdAt,
            startedAt: job.startedAt,
            completedAt: job.completedAt,
            expiresAt: job.expiresAt,
        },
    });
}));
router.put('/:id', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const data = updateJobSchema.parse(req.body);
    const job = await database_1.prisma.job.findFirst({
        where: { id, userId, status: 'REVIEW' },
    });
    if (!job) {
        throw new errors_1.AppError('Job not found or not in review status', 404, 'JOB_NOT_REVIEWABLE');
    }
    const updatedJob = await database_1.prisma.job.update({
        where: { id },
        data: {
            decisions: data.decisions,
            status: 'APPLYING',
        },
    });
    await cleanup_queue_1.cleanupQueue.add('apply-changes', {
        jobId: id,
        userId,
        decisions: data.decisions,
    }, {
        priority: 2,
        attempts: 3,
    });
    for (const decision of data.decisions) {
        const change = job.changes.find((c) => c.id === decision.changeId);
        if (change) {
            await database_1.prisma.swipePattern.upsert({
                where: {
                    userId_changeType_pattern: {
                        userId,
                        changeType: change.type,
                        pattern: change.pattern || change.type,
                    },
                },
                update: {
                    action: decision.decision === 'accept' ? 'ACCEPT' : 'REJECT',
                    usageCount: { increment: 1 },
                    lastUsedAt: new Date(),
                },
                create: {
                    userId,
                    changeType: change.type,
                    pattern: change.pattern || change.type,
                    filePattern: change.filePattern,
                    action: decision.decision === 'accept' ? 'ACCEPT' : 'REJECT',
                },
            });
        }
    }
    logger_1.logger.info('Job decisions submitted', {
        jobId: id,
        userId,
        decisionCount: data.decisions.length,
    });
    res.json({
        success: true,
        data: {
            id: updatedJob.id,
            status: updatedJob.status,
            message: 'Applying your decisions...',
        },
    });
}));
router.delete('/:id', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const job = await database_1.prisma.job.findFirst({
        where: {
            id,
            userId,
            status: { in: ['PENDING', 'PROCESSING', 'REVIEW'] },
        },
    });
    if (!job) {
        throw new errors_1.AppError('Job not found or cannot be cancelled', 404, 'JOB_NOT_CANCELLABLE');
    }
    if (job.status === 'PENDING' || job.status === 'PROCESSING') {
        const queueJob = await cleanup_queue_1.cleanupQueue.getJob(id);
        if (queueJob) {
            await queueJob.remove();
        }
    }
    await database_1.prisma.job.update({
        where: { id },
        data: { status: 'CANCELLED' },
    });
    logger_1.logger.info('Job cancelled', { jobId: id, userId });
    res.json({
        success: true,
        message: 'Job cancelled successfully',
    });
}));
router.post('/:id/retry', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const job = await database_1.prisma.job.findFirst({
        where: {
            id,
            userId,
            status: 'FAILED',
        },
    });
    if (!job) {
        throw new errors_1.AppError('Job not found or not retryable', 404, 'JOB_NOT_RETRYABLE');
    }
    const updatedJob = await database_1.prisma.job.update({
        where: { id },
        data: {
            status: 'PENDING',
            error: null,
            attempts: { increment: 1 },
        },
    });
    await cleanup_queue_1.cleanupQueue.add('process-cleanup', {
        jobId: id,
        userId,
        uploadId: job.uploadId,
        options: job.input.options,
        type: job.type,
        isRetry: true,
    }, {
        priority: 1,
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
    });
    logger_1.logger.info('Job retry initiated', {
        jobId: id,
        userId,
        attempt: updatedJob.attempts,
    });
    res.json({
        success: true,
        data: {
            id: updatedJob.id,
            status: updatedJob.status,
            message: 'Job requeued for processing',
        },
    });
}));
//# sourceMappingURL=job.route.js.map