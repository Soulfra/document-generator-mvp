"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToS3 = uploadToS3;
exports.downloadFromS3 = downloadFromS3;
exports.generatePresignedUrl = generatePresignedUrl;
exports.generateUploadUrl = generateUploadUrl;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const logger_1 = require("./logger");
const errors_1 = require("./errors");
// Initialize S3 client
const s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: true, // Required for MinIO
});
const bucket = process.env.S3_BUCKET_NAME || 'finishthisidea-storage';
async function uploadToS3(buffer, key, contentType) {
    try {
        const command = new client_s3_1.PutObjectCommand({
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
        logger_1.logger.info('File uploaded to S3', { key, size: buffer.length });
        return url;
    }
    catch (error) {
        logger_1.logger.error('S3 upload failed', { key, error });
        throw new errors_1.ExternalServiceError('Failed to upload file to storage', 'S3');
    }
}
async function downloadFromS3(url) {
    try {
        // Extract key from URL
        const urlParts = new URL(url);
        const key = urlParts.pathname.substring(1); // Remove leading slash
        const command = new client_s3_1.GetObjectCommand({
            Bucket: bucket,
            Key: key,
        });
        const response = await s3Client.send(command);
        if (!response.Body) {
            throw new Error('No file content received');
        }
        const chunks = [];
        const stream = response.Body;
        for await (const chunk of stream) {
            chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);
        logger_1.logger.info('File downloaded from S3', { key, size: buffer.length });
        return buffer;
    }
    catch (error) {
        logger_1.logger.error('S3 download failed', { url, error });
        throw new errors_1.ExternalServiceError('Failed to download file from storage', 'S3');
    }
}
async function generatePresignedUrl(key, expiresIn = 3600) {
    try {
        const command = new client_s3_1.GetObjectCommand({
            Bucket: bucket,
            Key: key,
        });
        const url = await (0, s3_request_presigner_1.getSignedUrl)(s3Client, command, { expiresIn });
        logger_1.logger.info('Presigned URL generated', { key, expiresIn });
        return url;
    }
    catch (error) {
        logger_1.logger.error('Failed to generate presigned URL', { key, error });
        throw new errors_1.ExternalServiceError('Failed to generate download link', 'S3');
    }
}
async function generateUploadUrl(key, contentType, expiresIn = 300) {
    try {
        const command = new client_s3_1.PutObjectCommand({
            Bucket: bucket,
            Key: key,
            ContentType: contentType,
        });
        const url = await (0, s3_request_presigner_1.getSignedUrl)(s3Client, command, { expiresIn });
        logger_1.logger.info('Upload URL generated', { key, contentType, expiresIn });
        return url;
    }
    catch (error) {
        logger_1.logger.error('Failed to generate upload URL', { key, error });
        throw new errors_1.ExternalServiceError('Failed to generate upload link', 'S3');
    }
}
//# sourceMappingURL=storage.js.map