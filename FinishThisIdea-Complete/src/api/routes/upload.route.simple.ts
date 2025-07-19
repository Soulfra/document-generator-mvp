import { Router } from 'express';
import multer from 'multer';
import { uploadFile } from '../../services/upload.service';
import { logger } from '../../utils/logger';
import { uploadRateLimiter } from '../../middleware/rate-limit.middleware';
import { prometheusMetrics } from '../../services/monitoring/prometheus-metrics.service';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 1,
  },
});

/**
 * POST /api/upload
 * Upload a codebase file for cleaning
 */
router.post(
  '/', 
  uploadRateLimiter,
  upload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'NO_FILE',
            message: 'No file provided. Please select a zip file to upload.',
          },
        });
      }

      const { profileId } = req.body;
      const result = await uploadFile(req.file, { profileId });

      // Record upload metrics
      const fileExtension = req.file.originalname.split('.').pop() || 'unknown';
      prometheusMetrics.recordUpload(fileExtension, 'completed');
      prometheusMetrics.recordJobCreated('FREE'); // Default tier for uploads

      res.json({
        success: true,
        data: {
          jobId: result.jobId,
          originalFileName: result.originalFileName,
          fileSize: result.fileSize,
          expiresAt: result.expiresAt,
          nextStep: {
            description: 'File uploaded successfully. Proceed to payment.',
            paymentUrl: `/api/payment/checkout`,
            statusUrl: `/api/jobs/${result.jobId}`,
          },
        },
      });

    } catch (error) {
      next(error);
    }
  }
);

export const uploadRouter = router;