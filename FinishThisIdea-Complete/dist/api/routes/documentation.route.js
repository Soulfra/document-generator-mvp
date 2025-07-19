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
exports.documentationRouter = void 0;
const express_1 = require("express");
const database_1 = require("../../utils/database");
const documentation_service_1 = require("../../services/documentation.service");
const async_handler_1 = require("../../utils/async-handler");
const storage_1 = require("../../utils/storage");
const zod_1 = require("zod");
const logger_1 = require("../../utils/logger");
const error_handler_1 = require("../../utils/error-handler");
const path = __importStar(require("path"));
const fs = __importStar(require("fs/promises"));
const archiver_1 = __importDefault(require("archiver"));
const uuid_1 = require("uuid");
const router = (0, express_1.Router)();
exports.documentationRouter = router;
const generateDocsSchema = zod_1.z.object({
    jobId: zod_1.z.string().uuid(),
    templates: zod_1.z.array(zod_1.z.string()).optional().default(['basic-readme']),
    includeInOutput: zod_1.z.boolean().default(true),
});
router.get('/templates', (0, async_handler_1.asyncHandler)(async (_req, res) => {
    const templates = await documentation_service_1.documentationService.getAvailableTemplates();
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
router.post('/generate', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const validatedData = generateDocsSchema.parse(req.body);
    const { jobId, templates, includeInOutput } = validatedData;
    logger_1.logger.info('Documentation generation requested', { jobId, templates });
    const job = await database_1.prisma.job.findUnique({
        where: { id: jobId },
        include: {
            analysisResult: true,
            user: true
        }
    });
    if (!job) {
        throw new error_handler_1.ValidationError('Job not found', { jobId });
    }
    if (job.status !== 'COMPLETED') {
        throw new error_handler_1.ValidationError('Job must be completed before generating documentation', {
            jobId,
            currentStatus: job.status
        });
    }
    const existingDocs = await database_1.prisma.documentation.findUnique({
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
    const codeAnalysis = await createCodeAnalysisFromJob(job);
    const documentationResult = await documentation_service_1.documentationService.generateDocumentation(jobId, codeAnalysis, templates);
    const packagedDocs = await packageDocumentation(jobId, documentationResult);
    const uploadUrl = await (0, storage_1.uploadToS3)(await fs.readFile(packagedDocs.zipPath), `documentation/${jobId}/docs.zip`);
    const documentation = await database_1.prisma.documentation.create({
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
    try {
        await fs.unlink(packagedDocs.zipPath);
        await fs.rm(packagedDocs.tempDir, { recursive: true, force: true });
    }
    catch (error) {
        logger_1.logger.warn('Failed to clean up temporary files', { error });
    }
    logger_1.logger.info('Documentation generated successfully', {
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
router.get('/:documentationId', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { documentationId } = req.params;
    const documentation = await database_1.prisma.documentation.findUnique({
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
router.get('/job/:jobId', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { jobId } = req.params;
    const documentation = await database_1.prisma.documentation.findUnique({
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
async function createCodeAnalysisFromJob(job) {
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
async function packageDocumentation(jobId, documentationResult) {
    const tempDir = path.join('/tmp', `docs-${jobId}-${(0, uuid_1.v4)()}`);
    await fs.mkdir(tempDir, { recursive: true });
    let fileCount = 0;
    let totalSize = 0;
    for (const template of documentationResult.templates) {
        const fileName = `${template.templateId}.md`;
        const filePath = path.join(tempDir, fileName);
        await fs.writeFile(filePath, template.content);
        const stat = await fs.stat(filePath);
        totalSize += stat.size;
        fileCount++;
    }
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
    const zipPath = path.join('/tmp', `docs-${jobId}.zip`);
    const output = fs.createWriteStream(zipPath);
    const archive = (0, archiver_1.default)('zip', { zlib: { level: 9 } });
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
//# sourceMappingURL=documentation.route.js.map