import { Router } from 'express';
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import { z } from 'zod';
import { prisma } from '../database/connection';
import { logger } from '../utils/logger';
import { asyncHandler } from '../utils/async-handler';
import { AppError } from '../utils/errors';

const router = Router();

// Configure S3 client
const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true, // Required for MinIO
});

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/zip',
      'application/x-zip-compressed',
      'application/x-tar',
      'application/x-gzip',
      'application/gzip',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`));
    }
  },
});

// Upload validation schema
const uploadSchema = z.object({
  userId: z.string().uuid(),
});

/**
 * POST /api/upload
 * Upload a code archive for processing
 */
router.post(
  '/',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    // Validate request
    const { userId } = uploadSchema.parse({ userId: req.user.id });
    
    if (!req.file) {
      throw new AppError('No file provided', 400, 'NO_FILE');
    }

    const file = req.file;
    logger.info('File upload started', {
      userId,
      filename: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    });

    try {
      // Generate file hash
      const fileHash = createHash('sha256')
        .update(file.buffer)
        .digest('hex');

      // Check if file already exists
      const existingUpload = await prisma.upload.findFirst({
        where: {
          hash: fileHash,
          userId,
          status: 'UPLOADED',
        },
      });

      if (existingUpload) {
        logger.info('File already uploaded, returning existing', {
          uploadId: existingUpload.id,
          userId,
        });

        return res.json({
          success: true,
          data: {
            id: existingUpload.id,
            filename: existingUpload.filename,
            size: existingUpload.size,
            status: existingUpload.status,
            createdAt: existingUpload.createdAt,
          },
        });
      }

      // Generate unique storage key
      const uploadId = uuidv4();
      const fileExtension = file.originalname.split('.').pop() || 'zip';
      const storageKey = `uploads/${userId}/${uploadId}/original.${fileExtension}`;

      // Upload to S3/MinIO
      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.S3_BUCKET || 'finishthisidea-uploads',
        Key: storageKey,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          userId,
          originalName: file.originalname,
          uploadId,
          hash: fileHash,
        },
      }));

      // Create upload record
      const uploadRecord = await prisma.upload.create({
        data: {
          id: uploadId,
          userId,
          filename: `original.${fileExtension}`,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          hash: fileHash,
          storageKey,
          storageUrl: `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${storageKey}`,
          status: 'UPLOADED',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });

      logger.info('File uploaded successfully', {
        uploadId,
        userId,
        size: file.size,
        hash: fileHash,
      });

      // Return upload details
      res.status(201).json({
        success: true,
        data: {
          id: uploadRecord.id,
          filename: uploadRecord.originalName,
          size: uploadRecord.size,
          status: uploadRecord.status,
          createdAt: uploadRecord.createdAt,
          expiresAt: uploadRecord.expiresAt,
        },
      });

    } catch (error) {
      logger.error('File upload failed', {
        error,
        userId,
        filename: file.originalname,
      });

      // Clean up partial upload if needed
      if (error instanceof Error) {
        throw new AppError(
          'Failed to upload file',
          500,
          'UPLOAD_FAILED',
          { originalError: error.message }
        );
      }
      throw error;
    }
  })
);

/**
 * GET /api/upload/:id
 * Get upload details
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const upload = await prisma.upload.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!upload) {
      throw new AppError('Upload not found', 404, 'UPLOAD_NOT_FOUND');
    }

    res.json({
      success: true,
      data: {
        id: upload.id,
        filename: upload.originalName,
        size: upload.size,
        status: upload.status,
        createdAt: upload.createdAt,
        expiresAt: upload.expiresAt,
      },
    });
  })
);

/**
 * DELETE /api/upload/:id
 * Delete an upload
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const upload = await prisma.upload.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!upload) {
      throw new AppError('Upload not found', 404, 'UPLOAD_NOT_FOUND');
    }

    // Check if upload is being used by any jobs
    const activeJobs = await prisma.job.count({
      where: {
        uploadId: id,
        status: {
          in: ['PENDING', 'PROCESSING', 'REVIEW'],
        },
      },
    });

    if (activeJobs > 0) {
      throw new AppError(
        'Cannot delete upload with active jobs',
        400,
        'UPLOAD_IN_USE'
      );
    }

    // Mark as deleted (soft delete)
    await prisma.upload.update({
      where: { id },
      data: { status: 'DELETED' },
    });

    logger.info('Upload deleted', { uploadId: id, userId });

    res.json({
      success: true,
      message: 'Upload deleted successfully',
    });
  })
);

export { router as uploadRouter };