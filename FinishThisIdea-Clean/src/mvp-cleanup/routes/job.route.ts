import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../database/connection';
import { cleanupQueue } from '../queues/cleanup.queue';
import { logger } from '../utils/logger';
import { asyncHandler } from '../utils/async-handler';
import { AppError } from '../utils/errors';
import { calculateCost } from '../utils/pricing';

const router = Router();

// Job creation schema
const createJobSchema = z.object({
  uploadId: z.string().uuid(),
  type: z.enum(['cleanup', 'refactor', 'format', 'full']).default('cleanup'),
  options: z.object({
    removeComments: z.boolean().default(false),
    removeConsoleLog: z.boolean().default(true),
    formatCode: z.boolean().default(true),
    optimizeImports: z.boolean().default(true),
    removeDeadCode: z.boolean().default(true),
    convertToTypeScript: z.boolean().default(false),
    addTests: z.boolean().default(false),
    llmProvider: z.enum(['ollama', 'openai', 'anthropic', 'auto']).default('auto'),
  }).default({}),
});

// Swipe decision schema
const swipeDecisionSchema = z.object({
  changeId: z.string(),
  decision: z.enum(['accept', 'reject', 'modify']),
  modifiedCode: z.string().optional(),
});

// Job update schema
const updateJobSchema = z.object({
  decisions: z.array(swipeDecisionSchema),
});

/**
 * POST /api/jobs
 * Create a new cleanup job
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const data = createJobSchema.parse(req.body);

    // Verify upload exists and belongs to user
    const upload = await prisma.upload.findFirst({
      where: {
        id: data.uploadId,
        userId,
        status: 'UPLOADED',
      },
    });

    if (!upload) {
      throw new AppError('Upload not found or not accessible', 404, 'UPLOAD_NOT_FOUND');
    }

    // Check for existing pending jobs
    const existingJob = await prisma.job.findFirst({
      where: {
        uploadId: data.uploadId,
        status: { in: ['PENDING', 'PROCESSING', 'REVIEW'] },
      },
    });

    if (existingJob) {
      throw new AppError(
        'A job is already in progress for this upload',
        400,
        'JOB_ALREADY_EXISTS'
      );
    }

    // Calculate estimated cost
    const estimatedCost = calculateCost({
      fileSize: upload.size,
      type: data.type,
      options: data.options,
    });

    // Create job record
    const job = await prisma.job.create({
      data: {
        userId,
        uploadId: data.uploadId,
        type: data.type,
        status: 'PENDING',
        input: {
          options: data.options,
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
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Add to processing queue
    await cleanupQueue.add('process-cleanup', {
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

    logger.info('Job created and queued', {
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
  })
);

/**
 * GET /api/jobs
 * List user's jobs
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { status, limit = 20, offset = 0 } = req.query;

    const where: any = { userId };
    
    if (status) {
      where.status = status as string;
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
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
      prisma.job.count({ where }),
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
  })
);

/**
 * GET /api/jobs/:id
 * Get job details
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const job = await prisma.job.findFirst({
      where: { id, userId },
      include: {
        upload: true,
        payment: true,
      },
    });

    if (!job) {
      throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');
    }

    // Get real-time progress from queue if processing
    let queueProgress = null;
    if (job.status === 'PROCESSING') {
      const queueJob = await cleanupQueue.getJob(id);
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
  })
);

/**
 * PUT /api/jobs/:id
 * Update job with swipe decisions
 */
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const data = updateJobSchema.parse(req.body);

    const job = await prisma.job.findFirst({
      where: { id, userId, status: 'REVIEW' },
    });

    if (!job) {
      throw new AppError(
        'Job not found or not in review status',
        404,
        'JOB_NOT_REVIEWABLE'
      );
    }

    // Update job with decisions
    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        decisions: data.decisions,
        status: 'APPLYING',
      },
    });

    // Queue application of changes
    await cleanupQueue.add('apply-changes', {
      jobId: id,
      userId,
      decisions: data.decisions,
    }, {
      priority: 2,
      attempts: 3,
    });

    // Store swipe patterns for future learning
    for (const decision of data.decisions) {
      const change = (job.changes as any[]).find((c: any) => c.id === decision.changeId);
      if (change) {
        await prisma.swipePattern.upsert({
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

    logger.info('Job decisions submitted', {
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
  })
);

/**
 * DELETE /api/jobs/:id
 * Cancel a job
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const job = await prisma.job.findFirst({
      where: {
        id,
        userId,
        status: { in: ['PENDING', 'PROCESSING', 'REVIEW'] },
      },
    });

    if (!job) {
      throw new AppError('Job not found or cannot be cancelled', 404, 'JOB_NOT_CANCELLABLE');
    }

    // Remove from queue if pending/processing
    if (job.status === 'PENDING' || job.status === 'PROCESSING') {
      const queueJob = await cleanupQueue.getJob(id);
      if (queueJob) {
        await queueJob.remove();
      }
    }

    // Update job status
    await prisma.job.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    logger.info('Job cancelled', { jobId: id, userId });

    res.json({
      success: true,
      message: 'Job cancelled successfully',
    });
  })
);

/**
 * POST /api/jobs/:id/retry
 * Retry a failed job
 */
router.post(
  '/:id/retry',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const job = await prisma.job.findFirst({
      where: {
        id,
        userId,
        status: 'FAILED',
      },
    });

    if (!job) {
      throw new AppError('Job not found or not retryable', 404, 'JOB_NOT_RETRYABLE');
    }

    // Reset job status
    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        status: 'PENDING',
        error: null,
        attempts: { increment: 1 },
      },
    });

    // Re-queue the job
    await cleanupQueue.add('process-cleanup', {
      jobId: id,
      userId,
      uploadId: job.uploadId!,
      options: (job.input as any).options,
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

    logger.info('Job retry initiated', {
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
  })
);

export { router as jobRouter };