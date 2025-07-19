"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = uploadFile;
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
const storage_1 = require("../utils/storage");
const database_1 = require("../utils/database");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
async function uploadFile(file, options) {
    validateFile(file);
    const jobId = (0, uuid_1.v4)();
    const fileExtension = path_1.default.extname(file.originalname);
    const s3Key = `uploads/${jobId}/${file.originalname}`;
    try {
        const uploadUrl = await (0, storage_1.uploadToS3)(file.buffer, s3Key, file.mimetype);
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const job = await database_1.prisma.job.create({
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
        logger_1.logger.info('File uploaded successfully', {
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
    }
    catch (error) {
        logger_1.logger.error('File upload failed', {
            fileName: file.originalname,
            fileSize: file.size,
            error,
        });
        throw error;
    }
}
function validateFile(file) {
    const maxSize = 50 * 1024 * 1024;
    const allowedTypes = [
        'application/zip',
        'application/x-zip-compressed',
        'application/x-tar',
        'application/gzip',
        'application/x-gzip',
    ];
    if (!file) {
        throw new errors_1.ValidationError('No file provided');
    }
    if (file.size > maxSize) {
        throw new errors_1.ValidationError(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum size is 50MB.`);
    }
    if (!allowedTypes.includes(file.mimetype)) {
        throw new errors_1.ValidationError(`Invalid file type: ${file.mimetype}. Only ZIP and TAR files are supported.`);
    }
    const allowedExtensions = ['.zip', '.tar', '.tar.gz', '.tgz'];
    const extension = path_1.default.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.some(ext => file.originalname.toLowerCase().endsWith(ext))) {
        throw new errors_1.ValidationError(`Invalid file extension: ${extension}. Only .zip, .tar, .tar.gz, and .tgz files are supported.`);
    }
    logger_1.logger.info('File validation passed', {
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
    });
}
//# sourceMappingURL=upload.service.js.map