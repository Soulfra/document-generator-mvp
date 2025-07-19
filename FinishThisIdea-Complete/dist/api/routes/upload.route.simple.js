"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRouter = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const upload_service_1 = require("../../services/upload.service");
const rate_limit_middleware_1 = require("../../middleware/rate-limit.middleware");
const prometheus_metrics_service_1 = require("../../services/monitoring/prometheus-metrics.service");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024,
        files: 1,
    },
});
router.post('/', rate_limit_middleware_1.uploadRateLimiter, upload.single('file'), async (req, res, next) => {
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
        const result = await (0, upload_service_1.uploadFile)(req.file, { profileId });
        const fileExtension = req.file.originalname.split('.').pop() || 'unknown';
        prometheus_metrics_service_1.prometheusMetrics.recordUpload(fileExtension, 'completed');
        prometheus_metrics_service_1.prometheusMetrics.recordJobCreated('FREE');
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
    }
    catch (error) {
        next(error);
    }
});
exports.uploadRouter = router;
//# sourceMappingURL=upload.route.simple.js.map