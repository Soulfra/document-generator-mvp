import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { uploadToS3 } from '../utils/storage';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { ValidationError } from '../utils/errors';

export interface UploadResult {
  jobId: string;
  uploadUrl: string;
  originalFileName: string;
  fileSize: number;
  expiresAt: Date;
}

export async function uploadFile(
  file: Express.Multer.File,
  options?: { profileId?: string }
): Promise<UploadResult> {
  // Validate file
  validateFile(file);

  const jobId = uuidv4();
  const fileExtension = path.extname(file.originalname);
  const s3Key = `uploads/${jobId}/${file.originalname}`;

  try {
    // Upload to S3
    const uploadUrl = await uploadToS3(
      file.buffer,
      s3Key,
      file.mimetype
    );

    // Calculate expiry (24 hours from now)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create job record
    const job = await prisma.job.create({
      data: {
        id: jobId,
        status: 'PENDING',
        inputFileUrl: uploadUrl,
        originalFileName: file.originalname,
        fileSizeBytes: file.size,
        expiresAt,
        input: options?.profileId ? { profileId: options.profileId } : {},
      },
    });

    logger.info('File uploaded successfully', {
      jobId,
      fileName: file.originalname,
      fileSize: file.size,
      uploadUrl,
    });

    return {
      jobId: job.id,
      uploadUrl,
      originalFileName: file.originalname,
      fileSize: file.size,
      expiresAt,
    };

  } catch (error) {
    logger.error('File upload failed', {
      fileName: file.originalname,
      fileSize: file.size,
      error,
    });
    throw error;
  }
}

function validateFile(file: Express.Multer.File): void {
  const maxSize = 50 * 1024 * 1024; // 50MB
  const allowedTypes = [
    'application/zip',
    'application/x-zip-compressed',
    'application/x-tar',
    'application/gzip',
    'application/x-gzip',
  ];

  if (!file) {
    throw new ValidationError('No file provided');
  }

  if (file.size > maxSize) {
    throw new ValidationError(
      `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum size is 50MB.`
    );
  }

  if (!allowedTypes.includes(file.mimetype)) {
    throw new ValidationError(
      `Invalid file type: ${file.mimetype}. Only ZIP and TAR files are supported.`
    );
  }

  // Check file extension as additional validation
  const allowedExtensions = ['.zip', '.tar', '.tar.gz', '.tgz'];
  const extension = path.extname(file.originalname).toLowerCase();
  
  if (!allowedExtensions.some(ext => file.originalname.toLowerCase().endsWith(ext))) {
    throw new ValidationError(
      `Invalid file extension: ${extension}. Only .zip, .tar, .tar.gz, and .tgz files are supported.`
    );
  }

  logger.info('File validation passed', {
    fileName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
  });
}