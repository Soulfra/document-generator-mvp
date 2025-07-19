import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from './logger';
import { ExternalServiceError } from './errors';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  endpoint: process.env.S3_ENDPOINT || undefined,
  forcePathStyle: true, // Required for MinIO
});

const bucket = process.env.S3_BUCKET_NAME || 'finishthisidea-storage';

export async function uploadToS3(
  buffer: Buffer, 
  key: string, 
  contentType?: string
): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType || 'application/octet-stream',
    });

    await s3Client.send(command);
    
    // For MinIO, use the endpoint URL
    const url = process.env.S3_ENDPOINT 
      ? `${process.env.S3_ENDPOINT}/${bucket}/${key}`
      : `https://${bucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
    
    logger.info('File uploaded to S3', { key, size: buffer.length });
    return url;
    
  } catch (error) {
    logger.error('S3 upload failed', { key, error });
    throw new ExternalServiceError('Failed to upload file to storage', 'S3');
  }
}

export async function downloadFromS3(url: string): Promise<Buffer> {
  try {
    // Extract key from URL
    const urlParts = new URL(url);
    const key = urlParts.pathname.substring(1); // Remove leading slash
    
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await s3Client.send(command);
    
    if (!response.Body) {
      throw new Error('No file content received');
    }

    const chunks: Uint8Array[] = [];
    const stream = response.Body as any;
    
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    
    const buffer = Buffer.concat(chunks);
    
    logger.info('File downloaded from S3', { key, size: buffer.length });
    return buffer;
    
  } catch (error) {
    logger.error('S3 download failed', { url, error });
    throw new ExternalServiceError('Failed to download file from storage', 'S3');
  }
}

export async function generatePresignedUrl(
  key: string, 
  expiresIn: number = 3600
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    
    logger.info('Presigned URL generated', { key, expiresIn });
    return url;
    
  } catch (error) {
    logger.error('Failed to generate presigned URL', { key, error });
    throw new ExternalServiceError('Failed to generate download link', 'S3');
  }
}

export async function generateUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 300
): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    
    logger.info('Upload URL generated', { key, contentType, expiresIn });
    return url;
    
  } catch (error) {
    logger.error('Failed to generate upload URL', { key, error });
    throw new ExternalServiceError('Failed to generate upload link', 'S3');
  }
}