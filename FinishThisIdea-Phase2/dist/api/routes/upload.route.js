"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const uuid_1 = require("uuid");
const storage_1 = require("../../utils/storage");
const logger_1 = require("../../utils/logger");
const presence_logger_1 = require("../../monitoring/presence-logger");
const router = (0, express_1.Router)();
// Configure multer for memory storage
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB || '50')) * 1024 * 1024 // Default 50MB
    },
    fileFilter: (req, file, cb) => {
        // Accept only zip and tar files
        const allowedTypes = ['application/zip', 'application/x-zip-compressed', 'application/x-tar', 'application/gzip'];
        const allowedExtensions = ['.zip', '.tar', '.tar.gz', '.tgz'];
        const hasValidType = allowedTypes.includes(file.mimetype);
        const hasValidExtension = allowedExtensions.some(ext => file.originalname.toLowerCase().endsWith(ext));
        if (hasValidType || hasValidExtension) {
            cb(null, true);
        }
        else {
            cb(new Error('Only ZIP and TAR files are allowed'));
        }
    }
});
/**
 * POST /api/upload
 * Upload a file to S3 and return the upload details
 */
router.post('/', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }
        const uploadId = (0, uuid_1.v4)();
        const fileExtension = req.file.originalname.split('.').pop() || 'zip';
        const s3Key = `uploads/${uploadId}/input.${fileExtension}`;
        logger_1.logger.info('Processing file upload', {
            uploadId,
            originalName: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype
        });
        // Log user presence for file upload
        await presence_logger_1.presenceLogger.logFileUpload({
            sessionId: req.sessionID,
            userId: req.session?.userId || 'anonymous',
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            fileType: req.file.mimetype,
            uploadId,
            s3Key
        });
        // Upload to S3
        const fileUrl = await (0, storage_1.uploadToS3)(req.file.buffer, s3Key, req.file.mimetype);
        // Store upload info in session
        if (!req.session) {
            req.session = {};
        }
        req.session.uploadInfo = {
            uploadId,
            fileUrl,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            uploadedAt: new Date().toISOString()
        };
        logger_1.logger.info('File uploaded successfully', {
            uploadId,
            fileUrl,
            size: req.file.size
        });
        res.json({
            success: true,
            data: {
                uploadId,
                fileName: req.file.originalname,
                fileSize: req.file.size,
                fileUrl // In production, don't expose this directly
            }
        });
    }
    catch (error) {
        logger_1.logger.error('File upload failed', { error });
        if (error instanceof multer_1.default.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(413).json({
                    success: false,
                    error: 'File too large. Maximum size is ' + process.env.MAX_FILE_SIZE_MB + 'MB'
                });
            }
        }
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to upload file'
        });
    }
});
/**
 * GET /api/upload/:uploadId
 * Get upload details
 */
router.get('/:uploadId', async (req, res) => {
    const { uploadId } = req.params;
    // In a real app, you'd fetch this from database
    const uploadInfo = req.session?.uploadInfo;
    if (!uploadInfo || uploadInfo.uploadId !== uploadId) {
        return res.status(404).json({
            success: false,
            error: 'Upload not found'
        });
    }
    res.json({
        success: true,
        data: uploadInfo
    });
});
exports.default = router;
//# sourceMappingURL=upload.route.js.map