import { Router } from 'express';
import { prisma } from '../../utils/database';
import { generatePresignedUrl } from '../../utils/storage';
import { NotFoundError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { prometheusMetrics } from '../../services/monitoring/prometheus-metrics.service';

const router = Router();

/**
 * GET /api/jobs/:jobId
 * Get job status and details
 */
router.get('/:jobId', async (req, res, next) => {
  try {
    const { jobId } = req.params;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        payment: true,
        analysisResult: true,
      },
    });

    if (!job) {
      throw new NotFoundError('Job not found');
    }

    // Record metrics for job status tracking
    const userTier = (job.metadata as any)?.userTier || 'FREE';
    prometheusMetrics.recordJobCompleted(job.status, userTier);

    // Calculate download URL if job is completed
    let downloadUrl = null;
    if (job.status === 'COMPLETED' && job.outputFileUrl) {
      try {
        // Extract S3 key from URL for presigned URL generation
        const url = new URL(job.outputFileUrl);
        const s3Key = url.pathname.substring(1); // Remove leading slash
        downloadUrl = await generatePresignedUrl(s3Key, 3600); // 1 hour expiry
      } catch (error) {
        logger.error('Failed to generate download URL', { jobId, error });
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
        
        // Payment info
        payment: job.payment ? {
          status: job.payment.status,
          amount: job.payment.amount,
          currency: job.payment.currency,
        } : null,
        
        // Analysis results (if available)
        results: job.analysisResult ? {
          totalFiles: job.analysisResult.totalFiles,
          linesOfCode: job.analysisResult.linesOfCode,
          languages: job.analysisResult.languages,
          improvements: job.analysisResult.improvements,
          processingCost: job.analysisResult.processingCostUsd,
        } : null,
        
        // Download URL (if completed)
        downloadUrl,
        
        // Next steps
        nextSteps: getNextSteps(job, downloadUrl),
      },
    };

    res.json(response);

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/jobs/:jobId/download
 * Download the cleaned codebase
 */
router.get('/:jobId/download', async (req, res, next) => {
  try {
    const { jobId } = req.params;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundError('Job not found');
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

    // Generate presigned URL and redirect
    const url = new URL(job.outputFileUrl);
    const s3Key = url.pathname.substring(1);
    const downloadUrl = await generatePresignedUrl(s3Key, 300); // 5 minute expiry for direct download

    res.redirect(downloadUrl);

  } catch (error) {
    next(error);
  }
});

function getNextSteps(job: any, downloadUrl: string | null): string[] {
  const steps: string[] = [];

  switch (job.status) {
    case 'PENDING':
      if (!job.payment || job.payment.status !== 'SUCCEEDED') {
        steps.push('Complete payment to start processing');
        steps.push('Check payment status periodically');
      } else {
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
      } else {
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

export const jobRouter = router;