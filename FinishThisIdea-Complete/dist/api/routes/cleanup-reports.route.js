"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupReportsRouter = void 0;
const express_1 = __importDefault(require("express"));
const async_handler_1 = require("../../utils/async-handler");
const cleanup_docs_service_1 = require("../../services/docs/cleanup-docs.service");
const database_1 = require("../../utils/database");
const logger_1 = require("../../utils/logger");
const trust_tier_middleware_1 = require("../../middleware/trust-tier.middleware");
const router = express_1.default.Router();
exports.cleanupReportsRouter = router;
router.post('/generate', (0, trust_tier_middleware_1.trustTierCheck)({ feature: 'allowAdvancedFeatures' }), (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { jobId, format = 'markdown', options = {} } = req.body;
    if (!jobId) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'JOB_ID_REQUIRED',
                message: 'Job ID is required to generate report'
            }
        });
    }
    try {
        const job = await database_1.prisma.job.findUnique({
            where: { id: jobId }
        });
        if (!job) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'JOB_NOT_FOUND',
                    message: 'Job not found'
                }
            });
        }
        if (job.status !== 'COMPLETED') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'JOB_NOT_COMPLETED',
                    message: 'Job must be completed to generate report'
                }
            });
        }
        const result = await cleanup_docs_service_1.cleanupDocs.generateCleanupReport(jobId, {
            format: format,
            includeAnalysis: options.includeAnalysis !== false,
            includeChangelog: options.includeChangelog !== false,
            includeMetrics: options.includeMetrics !== false,
            includeRecommendations: options.includeRecommendations !== false,
            branding: options.branding !== false
        });
        logger_1.logger.info('Report generated', {
            jobId,
            reportId: result.reportId,
            format
        });
        res.json({
            success: true,
            data: {
                reportId: result.reportId,
                downloadUrl: result.reportUrl,
                format,
                expiresIn: '1 hour'
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to generate report', { error: error.message, jobId });
        res.status(500).json({
            success: false,
            error: {
                code: 'REPORT_GENERATION_FAILED',
                message: 'Failed to generate report'
            }
        });
    }
}));
router.get('/job/:jobId', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { jobId } = req.params;
    try {
        const job = await database_1.prisma.job.findUnique({
            where: { id: jobId }
        });
        if (!job) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'JOB_NOT_FOUND',
                    message: 'Job not found'
                }
            });
        }
        const reports = job.metadata?.reports || [];
        res.json({
            success: true,
            data: {
                jobId,
                reports: reports.map((report) => ({
                    reportId: report.reportId,
                    format: report.format,
                    generatedAt: report.generatedAt,
                    downloadUrl: report.url
                }))
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to list reports', { error: error.message, jobId });
        res.status(500).json({
            success: false,
            error: {
                code: 'LIST_REPORTS_FAILED',
                message: 'Failed to list reports'
            }
        });
    }
}));
router.get('/:reportId', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { reportId } = req.params;
    try {
        const jobs = await database_1.prisma.job.findMany({
            where: {
                metadata: {
                    path: ['reports'],
                    array_contains: [{
                            reportId
                        }]
                }
            }
        });
        if (jobs.length === 0) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'REPORT_NOT_FOUND',
                    message: 'Report not found'
                }
            });
        }
        const job = jobs[0];
        const reports = job.metadata?.reports || [];
        const report = reports.find((r) => r.reportId === reportId);
        if (!report) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'REPORT_NOT_FOUND',
                    message: 'Report not found'
                }
            });
        }
        const { generatePresignedUrl, createS3Client } = await Promise.resolve().then(() => __importStar(require('../../utils/storage')));
        const s3Client = createS3Client();
        const downloadUrl = await generatePresignedUrl(s3Client, report.s3Key, 3600);
        res.json({
            success: true,
            data: {
                reportId: report.reportId,
                jobId: job.id,
                format: report.format,
                generatedAt: report.generatedAt,
                downloadUrl,
                expiresIn: '1 hour'
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get report', { error: error.message, reportId });
        res.status(500).json({
            success: false,
            error: {
                code: 'GET_REPORT_FAILED',
                message: 'Failed to get report'
            }
        });
    }
}));
router.post('/sample', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const sampleMarkdown = `# Sample Cleanup Report

> Generated on ${new Date().toLocaleDateString()}

## Summary

This is a sample report demonstrating the comprehensive documentation provided by FinishThisIdea's cleanup service.

## Overview

**Project:** sample-project.zip  
**Job ID:** sample-${Date.now()}  
**Status:** COMPLETED  
**Processing Time:** 45 seconds  
**File Size:** 2.34 MB  

## Code Analysis

The codebase analysis revealed the following insights:

- **Total Files:** 156
- **Lines of Code:** 12,453
- **Primary Languages:** JavaScript, TypeScript, CSS
- **Code Quality Score:** 87%
- **Issues Detected:** 23
- **Improvements Applied:** 19

### Language Distribution

| Language | Files | Percentage |
|----------|-------|------------|
| JavaScript | 78 | 50.0% |
| TypeScript | 45 | 28.8% |
| CSS | 20 | 12.8% |
| HTML | 10 | 6.4% |
| JSON | 3 | 1.9% |

### Issues Found

- Unused imports in 12 files
- Inconsistent indentation in 5 files
- Missing semicolons in 3 files
- Deprecated API usage in 2 files
- Unreachable code in 1 file

## Changes Made

The following improvements were applied to your codebase:

- Removed unused imports across all JavaScript and TypeScript files
- Standardized indentation to 2 spaces
- Added missing semicolons for consistency
- Updated deprecated API calls to modern equivalents
- Removed unreachable code blocks
- Organized imports alphabetically
- Applied consistent file naming conventions

## Performance Metrics

### Processing Performance

- **Total Processing Time:** 45.23 seconds
- **Files Processed:** 156
- **Processing Rate:** 3.45 files/second
- **AI Model Used:** Ollama (Local)
- **AI Decisions Made:** 89
- **Errors Encountered:** 0
- **Processing Cost:** $0.0012

### Resource Usage

- **Memory Efficiency:** Optimized
- **Backup Created:** Yes
- **Compression Applied:** Yes

## Recommendations

Based on our analysis, we recommend:

1. Consider using TypeScript for better type safety and IDE support.
2. Set up ESLint with a shared configuration for consistent code style.
3. Implement pre-commit hooks to catch issues before they're committed.
4. Review the updated folder structure and adjust import paths if needed.

### Next Steps

1. Review the cleaned codebase structure
2. Test critical functionality
3. Update your documentation if needed
4. Consider setting up automated code quality checks

---

*Generated by [FinishThisIdea](https://finishthisidea.com) - AI-powered codebase cleanup*`;
    res.json({
        success: true,
        data: {
            markdown: sampleMarkdown,
            message: 'This is a sample report. Generate a real report after completing a cleanup job.'
        }
    });
}));
//# sourceMappingURL=cleanup-reports.route.js.map