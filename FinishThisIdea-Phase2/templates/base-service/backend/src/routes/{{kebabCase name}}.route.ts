import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { addJob, getJob, getJobCounts } from '../queues/{{kebabCase name}}.queue';
import { {{pascalCase name}}Service } from '../services/{{kebabCase name}}.service';
import { Database } from '../database';
import { logger } from '../utils/logger';
import { rateLimiter } from '../middleware/rate-limit.middleware';
import { asyncHandler } from '../utils/async-handler';

const router = Router();
const service = new {{pascalCase name}}Service();

/**
 * Submit a new {{name}} job
 * POST /api/{{kebabCase name}}
 */
router.post(
  '/',
  rateLimiter({ max: {{rateLimitSubmit}} }),
  [
    {{#each inputValidation}}
    body('{{this.field}}'){{#if this.optional}}.optional(){{/if}}
      {{#each this.validators}}
      .{{this.method}}({{#if this.args}}{{json this.args}}{{/if}})
      {{#if this.message}}.withMessage('{{this.message}}'){{/if}}
      {{/each}},
    {{/each}}
    body('webhookUrl').optional().isURL().withMessage('Invalid webhook URL'),
    body('priority').optional().isIn(['low', 'normal', 'high']).withMessage('Invalid priority'),
  ],
  asyncHandler(async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: errors.array(),
        },
      });
    }

    const userId = req.user.id;
    const { {{#each requiredFields}}{{this}}, {{/each}}...additionalData } = req.body;

    try {
      // Create job record
      const job = await Database.jobs.create({
        data: {
          userId,
          type: '{{kebabCase name}}',
          status: 'pending',
          input: req.body,
          metadata: {
            ip: req.ip,
            userAgent: req.get('user-agent'),
            apiVersion: req.get('x-api-version') || 'v1',
          },
        },
      });

      // Add to queue
      const queueJob = await addJob({
        id: job.id,
        userId,
        data: {
          {{#each requiredFields}}
          {{this}},
          {{/each}}
          ...additionalData,
        },
      }, {
        priority: req.body.priority === 'high' ? 1 : 
                  req.body.priority === 'low' ? 10 : 5,
        delay: req.body.delay || 0,
      });

      logger.info('Created {{name}} job', { 
        jobId: job.id, 
        queueId: queueJob.id,
        userId,
      });

      res.status(201).json({
        success: true,
        data: {
          id: job.id,
          status: 'pending',
          createdAt: job.createdAt,
          estimatedCompletionTime: new Date(
            Date.now() + {{estimatedProcessingTime}} * 60 * 1000
          ),
          statusUrl: `${req.protocol}://${req.get('host')}/api/{{kebabCase name}}/${job.id}`,
          {{#if hasWebhook}}
          webhookUrl: req.body.webhookUrl,
          {{/if}}
        },
      });
    } catch (error) {
      logger.error('Failed to create {{name}} job', { error, userId });
      
      res.status(500).json({
        success: false,
        error: {
          code: 'JOB_CREATION_FAILED',
          message: 'Failed to create job',
        },
      });
    }
  })
);

/**
 * Get job status
 * GET /api/{{kebabCase name}}/:id
 */
router.get(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid job ID'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: errors.array(),
        },
      });
    }

    const { id } = req.params;
    const userId = req.user.id;

    // Get job from database
    const job = await Database.jobs.findFirst({
      where: { 
        id,
        userId,
        type: '{{kebabCase name}}',
      },
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'JOB_NOT_FOUND',
          message: 'Job not found',
        },
      });
    }

    // Get queue status if still processing
    let queueStatus = null;
    if (['pending', 'processing'].includes(job.status)) {
      const queueJob = await getJob(id);
      if (queueJob) {
        queueStatus = {
          progress: queueJob.progress(),
          attemptsMade: queueJob.attemptsMade,
          processedOn: queueJob.processedOn,
          finishedOn: queueJob.finishedOn,
        };
      }
    }

    res.json({
      success: true,
      data: {
        id: job.id,
        status: job.status,
        progress: job.progress || queueStatus?.progress || 0,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        {{#if hasOutput}}
        output: job.status === 'completed' ? {
          url: job.outputUrl,
          expiresAt: new Date(job.completedAt.getTime() + 24 * 60 * 60 * 1000),
        } : null,
        {{/if}}
        error: job.status === 'failed' ? job.error : null,
        metadata: job.metadata,
      },
    });
  })
);

/**
 * Get user's jobs
 * GET /api/{{kebabCase name}}
 */
router.get(
  '/',
  [
    query('status').optional().isIn(['pending', 'processing', 'completed', 'failed']),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
    query('sort').optional().isIn(['createdAt', 'completedAt', 'status']),
    query('order').optional().isIn(['asc', 'desc']),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: errors.array(),
        },
      });
    }

    const userId = req.user.id;
    const {
      status,
      limit = 20,
      offset = 0,
      sort = 'createdAt',
      order = 'desc',
    } = req.query;

    const where = {
      userId,
      type: '{{kebabCase name}}',
      ...(status && { status }),
    };

    const [jobs, total] = await Promise.all([
      Database.jobs.findMany({
        where,
        orderBy: { [sort]: order },
        take: limit,
        skip: offset,
        select: {
          id: true,
          status: true,
          progress: true,
          createdAt: true,
          completedAt: true,
          error: true,
        },
      }),
      Database.jobs.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
    });
  })
);

/**
 * Cancel a job
 * DELETE /api/{{kebabCase name}}/:id
 */
router.delete(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid job ID'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: errors.array(),
        },
      });
    }

    const { id } = req.params;
    const userId = req.user.id;

    // Get job
    const job = await Database.jobs.findFirst({
      where: { 
        id,
        userId,
        type: '{{kebabCase name}}',
      },
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'JOB_NOT_FOUND',
          message: 'Job not found',
        },
      });
    }

    if (!['pending', 'processing'].includes(job.status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'JOB_NOT_CANCELLABLE',
          message: `Cannot cancel job with status: ${job.status}`,
        },
      });
    }

    try {
      // Remove from queue
      const queueJob = await getJob(id);
      if (queueJob) {
        await queueJob.remove();
      }

      // Update database
      await Database.jobs.update({
        where: { id },
        data: {
          status: 'cancelled',
          completedAt: new Date(),
          metadata: {
            ...job.metadata,
            cancelledBy: userId,
            cancelledAt: new Date(),
          },
        },
      });

      logger.info('Cancelled {{name}} job', { jobId: id, userId });

      res.json({
        success: true,
        data: {
          id,
          status: 'cancelled',
        },
      });
    } catch (error) {
      logger.error('Failed to cancel {{name}} job', { error, jobId: id, userId });
      
      res.status(500).json({
        success: false,
        error: {
          code: 'CANCELLATION_FAILED',
          message: 'Failed to cancel job',
        },
      });
    }
  })
);

/**
 * Get service statistics
 * GET /api/{{kebabCase name}}/stats
 */
router.get(
  '/stats',
  rateLimiter({ max: 60 }),
  asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const [userStats, queueStats] = await Promise.all([
      // User statistics
      Database.jobs.groupBy({
        by: ['status'],
        where: {
          userId,
          type: '{{kebabCase name}}',
        },
        _count: {
          id: true,
        },
      }),
      // Queue statistics
      getJobCounts(),
    ]);

    const stats = {
      user: {
        total: userStats.reduce((sum, s) => sum + s._count.id, 0),
        byStatus: Object.fromEntries(
          userStats.map(s => [s.status, s._count.id])
        ),
      },
      queue: queueStats,
      limits: {
        maxJobsPerDay: {{maxJobsPerDay}},
        maxConcurrentJobs: {{maxConcurrentJobs}},
      },
    };

    res.json({
      success: true,
      data: stats,
    });
  })
);

{{#if hasAdditionalEndpoints}}
{{#each additionalEndpoints}}
/**
 * {{this.description}}
 * {{this.method}} /api/{{kebabCase ../name}}{{this.path}}
 */
router.{{toLowerCase this.method}}(
  '{{this.path}}',
  {{#if this.rateLimit}}
  rateLimiter({ max: {{this.rateLimit}} }),
  {{/if}}
  {{#if this.validation}}
  [
    {{#each this.validation}}
    {{this.type}}('{{this.field}}'){{#if this.optional}}.optional(){{/if}}
      {{#each this.rules}}
      .{{this}}()
      {{/each}},
    {{/each}}
  ],
  {{/if}}
  asyncHandler(async (req, res) => {
    {{this.handler}}
  })
);

{{/each}}
{{/if}}

export default router;