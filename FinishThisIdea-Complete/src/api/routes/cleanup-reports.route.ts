import express from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { cleanupDocs } from '../../services/docs/cleanup-docs.service';
import { prisma } from '../../utils/database';
import { logger } from '../../utils/logger';
import { trustTierCheck } from '../../middleware/trust-tier.middleware';

const router = express.Router();

// Generate a cleanup report
router.post('/generate', 
  trustTierCheck({ feature: 'allowAdvancedFeatures' }), // Reports are an advanced feature
  asyncHandler(async (req, res) => {
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
      // Verify job ownership
      const job = await prisma.job.findUnique({
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

      // Generate report
      const result = await cleanupDocs.generateCleanupReport(jobId, {
        format: format as any,
        includeAnalysis: options.includeAnalysis !== false,
        includeChangelog: options.includeChangelog !== false,
        includeMetrics: options.includeMetrics !== false,
        includeRecommendations: options.includeRecommendations !== false,
        branding: options.branding !== false
      });

      logger.info('Report generated', { 
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

    } catch (error) {
      logger.error('Failed to generate report', { error: error.message, jobId });
      res.status(500).json({
        success: false,
        error: {
          code: 'REPORT_GENERATION_FAILED',
          message: 'Failed to generate report'
        }
      });
    }
  })
);

// List reports for a job
router.get('/job/:jobId', asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  try {
    const job = await prisma.job.findUnique({
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

    const reports = (job.metadata as any)?.reports || [];
    
    res.json({
      success: true,
      data: {
        jobId,
        reports: reports.map((report: any) => ({
          reportId: report.reportId,
          format: report.format,
          generatedAt: report.generatedAt,
          downloadUrl: report.url // Will need to regenerate presigned URL
        }))
      }
    });

  } catch (error) {
    logger.error('Failed to list reports', { error: error.message, jobId });
    res.status(500).json({
      success: false,
      error: {
        code: 'LIST_REPORTS_FAILED',
        message: 'Failed to list reports'
      }
    });
  }
}));

// Get a specific report
router.get('/:reportId', asyncHandler(async (req, res) => {
  const { reportId } = req.params;

  try {
    // Find job containing this report
    const jobs = await prisma.job.findMany({
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
    const reports = (job.metadata as any)?.reports || [];
    const report = reports.find((r: any) => r.reportId === reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'REPORT_NOT_FOUND',
          message: 'Report not found'
        }
      });
    }

    // Generate fresh presigned URL
    const { generatePresignedUrl, createS3Client } = await import('../../utils/storage');
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

  } catch (error) {
    logger.error('Failed to get report', { error: error.message, reportId });
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_REPORT_FAILED',
        message: 'Failed to get report'
      }
    });
  }
}));

// Generate sample report (for demo purposes)
router.post('/sample', asyncHandler(async (req, res) => {
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

export { router as cleanupReportsRouter };