import { Router } from 'express';
import { prisma } from '../../utils/database';
import { documentationService } from '../../services/documentation.service';
import { asyncHandler } from '../../utils/async-handler';
import { uploadToS3 } from '../../utils/storage';
import { z } from 'zod';
import { logger } from '../../utils/logger';
import { ValidationError } from '../../utils/error-handler';
import * as path from 'path';
import * as fs from 'fs/promises';
import archiver from 'archiver';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Schema for documentation generation request
const generateDocsSchema = z.object({
  jobId: z.string().uuid(),
  templates: z.array(z.string()).optional().default(['basic-readme']),
  includeInOutput: z.boolean().default(true),
});

/**
 * GET /api/documentation/templates
 * Get available documentation templates
 */
router.get('/templates', asyncHandler(async (_req, res) => {
  const templates = await documentationService.getAvailableTemplates();
  
  const templateSummary = templates.map(template => ({
    id: template.id,
    name: template.name,
    description: template.description,
    sections: template.sections.map(s => s.title),
    requiredAnalysis: template.requiredAnalysis
  }));

  res.json({
    success: true,
    data: {
      templates: templateSummary,
      totalCount: templates.length
    }
  });
}));

/**
 * POST /api/documentation/generate
 * Generate documentation for a completed cleanup job
 * This is the $3 upsell feature!
 */
router.post('/generate', asyncHandler(async (req, res) => {
  const validatedData = generateDocsSchema.parse(req.body);
  const { jobId, templates, includeInOutput } = validatedData;

  logger.info('Documentation generation requested', { jobId, templates });

  // Get the job and ensure it's completed
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      analysisResult: true,
      user: true
    }
  });

  if (!job) {
    throw new ValidationError('Job not found', { jobId });
  }

  if (job.status !== 'COMPLETED') {
    throw new ValidationError('Job must be completed before generating documentation', { 
      jobId, 
      currentStatus: job.status 
    });
  }

  // Check if documentation already exists
  const existingDocs = await prisma.documentation.findUnique({
    where: { jobId }
  });

  if (existingDocs) {
    return res.json({
      success: true,
      data: {
        documentationId: existingDocs.id,
        downloadUrl: existingDocs.url,
        templates: existingDocs.templates,
        metadata: existingDocs.metadata,
        message: 'Documentation already exists for this job'
      }
    });
  }

  // Create mock code analysis from job data
  const codeAnalysis = await createCodeAnalysisFromJob(job);

  // Generate documentation
  const documentationResult = await documentationService.generateDocumentation(
    jobId,
    codeAnalysis,
    templates
  );

  // Package documentation files
  const packagedDocs = await packageDocumentation(jobId, documentationResult);

  // Upload to S3
  const uploadUrl = await uploadToS3(
    await fs.readFile(packagedDocs.zipPath),
    `documentation/${jobId}/docs.zip`
  );

  // Store documentation record
  const documentation = await prisma.documentation.create({
    data: {
      jobId,
      userId: job.userId,
      url: uploadUrl,
      templates,
      metadata: {
        quality: documentationResult.quality,
        tokensUsed: documentationResult.metadata.tokensUsed,
        generationTime: documentationResult.metadata.generationTime,
        aiProvider: documentationResult.metadata.aiProvider,
        packageInfo: {
          totalFiles: packagedDocs.fileCount,
          totalSizeBytes: packagedDocs.totalSize
        }
      }
    }
  });

  // Clean up temporary files
  try {
    await fs.unlink(packagedDocs.zipPath);
    await fs.rm(packagedDocs.tempDir, { recursive: true, force: true });
  } catch (error) {
    logger.warn('Failed to clean up temporary files', { error });
  }

  logger.info('Documentation generated successfully', {
    jobId,
    documentationId: documentation.id,
    templates,
    qualityScore: documentationResult.quality.overallScore
  });

  res.json({
    success: true,
    data: {
      documentationId: documentation.id,
      downloadUrl: uploadUrl,
      templates,
      quality: documentationResult.quality,
      metadata: documentationResult.metadata,
      message: 'Documentation generated successfully! This is a $3 premium feature.'
    }
  });
}));

/**
 * GET /api/documentation/:documentationId
 * Get documentation details
 */
router.get('/:documentationId', asyncHandler(async (req, res) => {
  const { documentationId } = req.params;

  const documentation = await prisma.documentation.findUnique({
    where: { id: documentationId },
    include: {
      job: {
        select: {
          id: true,
          originalFileName: true,
          status: true,
          createdAt: true
        }
      }
    }
  });

  if (!documentation) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'DOCUMENTATION_NOT_FOUND',
        message: 'Documentation not found'
      }
    });
  }

  res.json({
    success: true,
    data: documentation
  });
}));

/**
 * GET /api/documentation/job/:jobId
 * Get documentation for a specific job
 */
router.get('/job/:jobId', asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  const documentation = await prisma.documentation.findUnique({
    where: { jobId },
    include: {
      job: {
        select: {
          id: true,
          originalFileName: true,
          status: true,
          createdAt: true
        }
      }
    }
  });

  if (!documentation) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'DOCUMENTATION_NOT_FOUND',
        message: 'No documentation found for this job'
      }
    });
  }

  res.json({
    success: true,
    data: documentation
  });
}));

/**
 * Helper function to create code analysis from job data
 */
async function createCodeAnalysisFromJob(job: any): Promise<any> {
  // Extract information from job metadata and analysis result
  const analysisResult = job.analysisResult;
  const metadata = job.metadata || {};

  return {
    projectInfo: {
      name: metadata.projectName || job.originalFileName.replace(/\.(zip|tar\.gz)$/, ''),
      description: metadata.description || 'A code project processed by FinishThisIdea',
      type: metadata.projectType || 'webapp',
      language: analysisResult?.languages ? Object.keys(analysisResult.languages)[0] : 'javascript',
      framework: metadata.framework,
      version: '1.0.0',
      baseUrl: 'http://localhost:3000/api'
    },
    apis: metadata.apis || [],
    dataModels: metadata.dataModels || [],
    functions: metadata.functions || [],
    dependencies: metadata.dependencies || [],
    testCoverage: {
      coverage: 0,
      totalTests: 0,
      passingTests: 0,
      testFiles: []
    },
    architecture: {
      pattern: 'MVC',
      layers: ['presentation', 'business', 'data'],
      components: [],
      integrations: []
    },
    businessLogic: metadata.businessRules || [],
    fileStructure: {
      totalFiles: analysisResult?.totalFiles || 0,
      directories: [],
      languages: analysisResult?.languages || {}
    }
  };
}

/**
 * Helper function to package documentation into ZIP file
 */
async function packageDocumentation(jobId: string, documentationResult: any): Promise<{
  zipPath: string;
  tempDir: string;
  fileCount: number;
  totalSize: number;
}> {
  const tempDir = path.join('/tmp', `docs-${jobId}-${uuidv4()}`);
  await fs.mkdir(tempDir, { recursive: true });

  let fileCount = 0;
  let totalSize = 0;

  // Write each template to a file
  for (const template of documentationResult.templates) {
    const fileName = `${template.templateId}.md`;
    const filePath = path.join(tempDir, fileName);
    await fs.writeFile(filePath, template.content);
    
    const stat = await fs.stat(filePath);
    totalSize += stat.size;
    fileCount++;
  }

  // Write quality report
  const qualityReport = `# Documentation Quality Report

## Overall Score: ${Math.round(documentationResult.quality.overallScore * 100)}%

### Quality Metrics
- **Completeness**: ${Math.round(documentationResult.quality.completeness * 100)}%
- **Accuracy**: ${Math.round(documentationResult.quality.accuracy * 100)}%
- **Readability**: ${Math.round(documentationResult.quality.readability * 100)}%

### Generation Metadata
- **Tokens Used**: ${documentationResult.metadata.tokensUsed}
- **Generation Time**: ${documentationResult.metadata.generationTime}ms
- **AI Provider**: ${documentationResult.metadata.aiProvider}

### Templates Generated
${documentationResult.templates.map(t => `- ${t.templateName} (${t.sections.length} sections)`).join('\n')}

---
Generated by FinishThisIdea Documentation Service
`;

  const qualityPath = path.join(tempDir, 'quality-report.md');
  await fs.writeFile(qualityPath, qualityReport);
  const qualityStat = await fs.stat(qualityPath);
  totalSize += qualityStat.size;
  fileCount++;

  // Create ZIP file
  const zipPath = path.join('/tmp', `docs-${jobId}.zip`);
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  archive.pipe(output);
  archive.directory(tempDir, false);
  await archive.finalize();

  return {
    zipPath,
    tempDir,
    fileCount,
    totalSize
  };
}

export { router as documentationRouter };