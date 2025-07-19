import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../utils/database';
import { logger } from '../../utils/logger';
import { asyncHandler } from '../../utils/async-handler';
import { cleanupQueue } from '../../jobs/cleanup.queue';
import { uploadToS3, generatePresignedUrl } from '../../utils/storage';
import { createStripeSession } from '../../services/payment.service';
import { trustTierCheck, trustTierRateLimit, trustTierFileValidation } from '../../middleware/trust-tier.middleware';
import { handleError, getErrorMessage } from '../../utils/errors';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
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
    } else {
      cb(new Error('Only ZIP and TAR files are allowed'));
    }
  }
});

// Upload endpoint with trust tier validation
router.post('/upload', 
  trustTierRateLimit(), // Check rate limits first
  trustTierCheck(), // Check tier permissions
  upload.single('file'), 
  trustTierFileValidation(), // Validate file after upload
  asyncHandler(async (req, res) => {
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
  const jobId = uuidv4();
  const s3Key = `uploads/${jobId}/${file.originalname}`;

  try {
    // Upload file to S3
    const uploadResult = await uploadToS3(
      file.buffer,
      s3Key,
      file.mimetype
    );

    // Calculate expiration (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Get user ID and tier info
    const userId = req.user?.id || req.body?.userId;
    const trustTier = req.trustTier || 'BRONZE';
    const trustFeatures = req.trustFeatures;

    // Create job record with tier info
    const job = await prisma.job.create({
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

    logger.info('File uploaded successfully', {
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

  } catch (error) {
    const appError = handleError(error);
    logger.error('Upload failed', { error: getErrorMessage(error), jobId });
    res.status(appError.statusCode).json({
      success: false,
      error: {
        code: appError.code || 'UPLOAD_FAILED',
        message: appError.message
      }
    });
  }
}));

// Payment endpoint
router.post('/payment/checkout', asyncHandler(async (req, res) => {
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
    // Get job
    const job = await prisma.job.findUnique({
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

    // Create Stripe session
    const session = await createStripeSession({
      jobId,
      amount: 100, // $1.00 in cents
      currency: 'usd',
      description: `Codebase cleanup for ${job.originalFileName}`
    });

    // Update job with stripe session
    await prisma.job.update({
      where: { id: jobId },
      data: {
        stripeSessionId: session.id
      }
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        jobId,
        amount: 100,
        currency: 'usd',
        status: 'PENDING'
      }
    });

    logger.info('Payment session created', { jobId, sessionId: session.id });

    res.json({
      success: true,
      data: {
        checkoutUrl: session.url,
        sessionId: session.id
      }
    });

  } catch (error) {
    const appError = handleError(error);
    logger.error('Payment setup failed', { error: getErrorMessage(error), jobId });
    res.status(appError.statusCode).json({
      success: false,
      error: {
        code: appError.code || 'PAYMENT_FAILED',
        message: appError.message
      }
    });
  }
}));

// Job status endpoint
router.get('/jobs/:jobId', asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  try {
    const job = await prisma.job.findUnique({
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

    // Generate download URL if completed
    let downloadUrl = null;
    if (job.status === 'COMPLETED' && job.outputFileUrl) {
      try {
        const s3Key = job.outputFileUrl.replace(`s3://${process.env.S3_BUCKET}/`, '');
        downloadUrl = await generatePresignedUrl(s3Key, 3600); // 1 hour expiry
      } catch (error) {
        logger.error('Failed to generate download URL', { jobId, error: getErrorMessage(error) });
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

  } catch (error) {
    const appError = handleError(error);
    logger.error('Failed to get job status', { error: getErrorMessage(error), jobId });
    return res.status(appError.statusCode).json({
      success: false,
      error: {
        code: appError.code || 'STATUS_FAILED',
        message: appError.message
      }
    });
  }
}));

// Job download endpoint
router.get('/jobs/:jobId/download', asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  try {
    const job = await prisma.job.findUnique({
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

    // Generate download URL
    const s3Key = job.outputFileUrl.replace(`s3://${process.env.S3_BUCKET}/`, '');
    const downloadUrl = await generatePresignedUrl(s3Key, 3600); // 1 hour expiry

    // Redirect to S3 download URL
    res.redirect(downloadUrl);

  } catch (error) {
    const appError = handleError(error);
    logger.error('Failed to download file', { error: getErrorMessage(error), jobId });
    return res.status(appError.statusCode).json({
      success: false,
      error: {
        code: appError.code || 'DOWNLOAD_FAILED',
        message: appError.message
      }
    });
  }
}));

// Start processing endpoint (called after payment success)
router.post('/jobs/:jobId/start', 
  trustTierCheck({ feature: 'allowClaude' }), // Check if tier allows Claude usage
  asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  try {
    const job = await prisma.job.findUnique({
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

    // Update job status
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'PROCESSING',
        processingStartedAt: new Date(),
        progress: 5
      }
    });

    // Add job to queue with priority based on tier
    const priority = req.trustFeatures?.priorityProcessing ? 1 : 10;
    
    await cleanupQueue.add('cleanup-code', {
      jobId,
      inputFileUrl: job.inputFileUrl,
      originalFileName: job.originalFileName,
      contextProfileId: job.contextProfileId,
      trustTier: req.trustTier || 'BRONZE',
      allowClaude: req.trustFeatures?.allowClaude || false
    }, {
      delay: 1000, // Start after 1 second
      priority, // Higher priority for premium tiers
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 60000 // 1 minute base delay
      }
    });

    logger.info('Job started processing', { jobId });

    res.json({
      success: true,
      data: {
        jobId,
        status: 'PROCESSING',
        message: 'Processing started'
      }
    });

  } catch (error) {
    const appError = handleError(error);
    logger.error('Failed to start job processing', { error: getErrorMessage(error), jobId });
    return res.status(appError.statusCode).json({
      success: false,
      error: {
        code: appError.code || 'START_FAILED',
        message: appError.message
      }
    });
  }
}));

// List backups for a job
router.get('/jobs/:jobId/backups', asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  
  try {
    const job = await prisma.job.findUnique({
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

    const backups = (job.metadata as any)?.backups || [];
    
    res.json({
      success: true,
      data: {
        jobId,
        backups: backups.filter((b: any) => new Date(b.expiresAt) > new Date())
      }
    });

  } catch (error) {
    const appError = handleError(error);
    logger.error('Failed to list backups', { error: getErrorMessage(error), jobId });
    return res.status(appError.statusCode).json({
      success: false,
      error: {
        code: appError.code || 'LIST_BACKUPS_FAILED',
        message: appError.message
      }
    });
  }
}));

// List jobs endpoint
router.get('/jobs', asyncHandler(async (req, res) => {
  const { status, limit = 10, offset = 0 } = req.query;

  try {
    const where = status ? { status: status as any } : {};
    
    const jobs = await prisma.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
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

    const total = await prisma.job.count({ where });

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
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: parseInt(offset as string) + parseInt(limit as string) < total
        }
      }
    });

  } catch (error) {
    const appError = handleError(error);
    logger.error('Failed to list jobs', { error: getErrorMessage(error) });
    return res.status(appError.statusCode).json({
      success: false,
      error: {
        code: appError.code || 'LIST_FAILED',
        message: appError.message
      }
    });
  }
}));

export { router as cleanupRouter };