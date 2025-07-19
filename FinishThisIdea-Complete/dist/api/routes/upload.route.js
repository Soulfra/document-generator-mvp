"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRouter = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const client_s3_1 = require("@aws-sdk/client-s3");
const uuid_1 = require("uuid");
const crypto_1 = require("crypto");
const zod_1 = require("zod");
const database_1 = require("../../utils/database");
const logger_1 = require("../../utils/logger");
const async_handler_1 = require("../../utils/async-handler");
const errors_1 = require("../../utils/errors");
const router = (0, express_1.Router)();
exports.uploadRouter = router;
const s3Client = new client_s3_1.S3Client({
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    region: process.env.S3_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
    },
    forcePathStyle: true,
});
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024,
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
        }
        else {
            cb(new Error(`Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`));
        }
    },
});
const uploadSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid(),
});
router.post('/', upload.single('file'), (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { userId } = uploadSchema.parse({ userId: req.user.id });
    if (!req.file) {
        throw new errors_1.AppError('No file provided', 400, 'NO_FILE');
    }
    const file = req.file;
    logger_1.logger.info('File upload started', {
        userId,
        filename: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
    });
    try {
        const fileHash = (0, crypto_1.createHash)('sha256')
            .update(file.buffer)
            .digest('hex');
        const existingUpload = await database_1.prisma.upload.findFirst({
            where: {
                hash: fileHash,
                userId,
                status: 'UPLOADED',
            },
        });
        if (existingUpload) {
            logger_1.logger.info('File already uploaded, returning existing', {
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
        const uploadId = (0, uuid_1.v4)();
        const fileExtension = file.originalname.split('.').pop() || 'zip';
        const storageKey = `uploads/${userId}/${uploadId}/original.${fileExtension}`;
        await s3Client.send(new client_s3_1.PutObjectCommand({
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
        const uploadRecord = await database_1.prisma.upload.create({
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
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
        });
        logger_1.logger.info('File uploaded successfully', {
            uploadId,
            userId,
            size: file.size,
            hash: fileHash,
        });
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
    }
    catch (error) {
        logger_1.logger.error('File upload failed', {
            error,
            userId,
            filename: file.originalname,
        });
        if (error instanceof Error) {
            throw new errors_1.AppError('Failed to upload file', 500, 'UPLOAD_FAILED', { originalError: error.message });
        }
        throw error;
    }
}));
router.get('/:id', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const upload = await database_1.prisma.upload.findFirst({
        where: {
            id,
            userId,
        },
    });
    if (!upload) {
        throw new errors_1.AppError('Upload not found', 404, 'UPLOAD_NOT_FOUND');
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
}));
router.delete('/:id', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const upload = await database_1.prisma.upload.findFirst({
        where: {
            id,
            userId,
        },
    });
    if (!upload) {
        throw new errors_1.AppError('Upload not found', 404, 'UPLOAD_NOT_FOUND');
    }
    const activeJobs = await database_1.prisma.job.count({
        where: {
            uploadId: id,
            status: {
                in: ['PENDING', 'PROCESSING', 'REVIEW'],
            },
        },
    });
    if (activeJobs > 0) {
        throw new errors_1.AppError('Cannot delete upload with active jobs', 400, 'UPLOAD_IN_USE');
    }
    await database_1.prisma.upload.update({
        where: { id },
        data: { status: 'DELETED' },
    });
    logger_1.logger.info('Upload deleted', { uploadId: id, userId });
    res.json({
        success: true,
        message: 'Upload deleted successfully',
    });
}));
//# sourceMappingURL=upload.route.js.map