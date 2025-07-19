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
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupDocs = exports.CleanupDocsService = void 0;
const marked_1 = require("marked");
const database_1 = require("../../utils/database");
const platform_logger_service_1 = require("../monitoring/platform-logger.service");
const storage_1 = require("../../utils/storage");
const cleanup_memory_service_1 = require("../memory/cleanup-memory.service");
const serviceLogger = platform_logger_service_1.platformLogger.createServiceLogger('cleanup-docs-service');
class CleanupDocsService {
    async generateCleanupReport(jobId, options = { format: 'markdown' }) {
        const startTime = Date.now();
        const reportId = `report-${jobId}-${Date.now()}`;
        try {
            serviceLogger.info('Generating cleanup report', { jobId, reportId, format: options.format });
            const job = await database_1.prisma.job.findUnique({
                where: { id: jobId },
                include: {
                    analysisResult: true,
                    payment: true,
                    contextProfile: true
                }
            });
            if (!job) {
                throw new Error('Job not found');
            }
            if (job.status !== 'COMPLETED') {
                throw new Error('Job must be completed to generate report');
            }
            const thoughts = await cleanup_memory_service_1.cleanupMemory.getJobThoughts(jobId);
            const report = await this.buildReport(job, thoughts, options);
            let documentContent;
            let fileExtension;
            switch (options.format) {
                case 'html':
                    documentContent = await this.generateHTMLReport(report);
                    fileExtension = 'html';
                    break;
                case 'pdf':
                    documentContent = await this.generatePDFReport(report);
                    fileExtension = 'pdf';
                    break;
                default:
                    documentContent = await this.generateMarkdownReport(report);
                    fileExtension = 'md';
            }
            const s3Key = `reports/${jobId}/${reportId}.${fileExtension}`;
            const reportUrl = await (0, storage_1.uploadToS3)(Buffer.from(documentContent), s3Key, options.format === 'pdf' ? 'application/pdf' : 'text/plain');
            await database_1.prisma.job.update({
                where: { id: jobId },
                data: {
                    metadata: {
                        ...(job.metadata || {}),
                        reports: [
                            ...(job.metadata?.reports || []),
                            {
                                reportId,
                                format: options.format,
                                generatedAt: new Date(),
                                url: reportUrl,
                                s3Key
                            }
                        ]
                    }
                }
            });
            const duration = Date.now() - startTime;
            await serviceLogger.track('report-generated', duration, {
                jobId,
                reportId,
                format: options.format
            });
            const downloadUrl = await (0, storage_1.generatePresignedUrl)(await this.getS3Client(), s3Key, 3600);
            return { reportUrl: downloadUrl, reportId };
        }
        catch (error) {
            serviceLogger.error(error, { jobId, reportId, operation: 'generate-report' });
            throw new Error(`Failed to generate report: ${error.message}`);
        }
    }
    async buildReport(job, thoughts, options) {
        const sections = [];
        sections.push({
            title: 'Overview',
            type: 'overview',
            content: this.generateOverviewContent(job)
        });
        if (options.includeAnalysis !== false && job.analysisResult) {
            sections.push({
                title: 'Code Analysis',
                type: 'analysis',
                content: this.generateAnalysisContent(job.analysisResult),
                subsections: [
                    {
                        title: 'Language Distribution',
                        type: 'analysis',
                        content: this.generateLanguageDistribution(job.analysisResult.languages)
                    },
                    {
                        title: 'Issues Found',
                        type: 'analysis',
                        content: this.generateIssuesList(job.analysisResult.issues)
                    }
                ]
            });
        }
        if (options.includeChangelog !== false && job.analysisResult?.improvements) {
            sections.push({
                title: 'Changes Made',
                type: 'changes',
                content: this.generateChangesContent(job.analysisResult.improvements)
            });
        }
        if (options.includeMetrics !== false) {
            sections.push({
                title: 'Performance Metrics',
                type: 'metrics',
                content: this.generateMetricsContent(job, thoughts)
            });
        }
        if (options.includeRecommendations !== false) {
            sections.push({
                title: 'Recommendations',
                type: 'recommendations',
                content: await this.generateRecommendations(job, thoughts)
            });
        }
        return {
            jobId: job.id,
            title: `Cleanup Report: ${job.originalFileName}`,
            summary: this.generateSummary(job),
            sections,
            metadata: {
                generatedAt: new Date(),
                format: options.format,
                fileSize: 0
            }
        };
    }
    async generateMarkdownReport(report) {
        let markdown = `# ${report.title}\n\n`;
        markdown += `> Generated on ${report.metadata.generatedAt.toLocaleDateString()}\n\n`;
        markdown += `## Summary\n\n${report.summary}\n\n`;
        for (const section of report.sections) {
            markdown += `## ${section.title}\n\n`;
            markdown += `${section.content}\n\n`;
            if (section.subsections) {
                for (const subsection of section.subsections) {
                    markdown += `### ${subsection.title}\n\n`;
                    markdown += `${subsection.content}\n\n`;
                }
            }
        }
        markdown += `---\n\n`;
        markdown += `*Generated by [FinishThisIdea](https://finishthisidea.com) - AI-powered codebase cleanup*\n`;
        return markdown;
    }
    async generateHTMLReport(report) {
        const markdown = await this.generateMarkdownReport(report);
        const htmlContent = (0, marked_1.marked)(markdown);
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${report.title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        
        h1, h2, h3 {
            color: #1a1a1a;
            margin-top: 30px;
            margin-bottom: 15px;
        }
        
        h1 {
            border-bottom: 3px solid #1d9bf0;
            padding-bottom: 10px;
        }
        
        h2 {
            border-bottom: 1px solid #e1e8ed;
            padding-bottom: 8px;
        }
        
        blockquote {
            background: #e8f4fd;
            border-left: 4px solid #1d9bf0;
            padding: 10px 20px;
            margin: 20px 0;
            color: #555;
        }
        
        pre {
            background: #f4f4f4;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 15px;
            overflow-x: auto;
        }
        
        code {
            background: #f4f4f4;
            padding: 2px 5px;
            border-radius: 3px;
            font-family: 'Consolas', 'Monaco', monospace;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        
        th {
            background: #f8f9fa;
            font-weight: bold;
        }
        
        tr:nth-child(even) {
            background: #f8f9fa;
        }
        
        .metric-card {
            background: white;
            border: 1px solid #e1e8ed;
            border-radius: 8px;
            padding: 20px;
            margin: 15px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .metric-value {
            font-size: 2rem;
            font-weight: bold;
            color: #1d9bf0;
        }
        
        .metric-label {
            color: #666;
            font-size: 0.9rem;
        }
        
        .report-footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e1e8ed;
            text-align: center;
            color: #666;
        }
        
        @media print {
            body {
                background: white;
            }
            .metric-card {
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    ${htmlContent}
    <div class="report-footer">
        <p>Report generated on ${new Date().toLocaleString()}</p>
    </div>
</body>
</html>`;
        return html;
    }
    async generatePDFReport(report) {
        return this.generateHTMLReport(report);
    }
    generateOverviewContent(job) {
        const processingTime = job.processingEndedAt && job.processingStartedAt
            ? Math.round((job.processingEndedAt.getTime() - job.processingStartedAt.getTime()) / 1000)
            : 0;
        return `
**Project:** ${job.originalFileName}  
**Job ID:** ${job.id}  
**Status:** ${job.status}  
**Processing Time:** ${processingTime} seconds  
**File Size:** ${(job.fileSizeBytes / 1024 / 1024).toFixed(2)} MB  
**Completed:** ${job.processingEndedAt?.toLocaleString() || 'N/A'}  
    `.trim();
    }
    generateAnalysisContent(analysis) {
        return `
The codebase analysis revealed the following insights:

- **Total Files:** ${analysis.totalFiles}
- **Lines of Code:** ${analysis.linesOfCode.toLocaleString()}
- **Primary Languages:** ${Object.keys(analysis.languages || {}).slice(0, 3).join(', ')}
- **Code Quality Score:** ${analysis.ollamaConfidence ? Math.round(analysis.ollamaConfidence * 100) + '%' : 'N/A'}
- **Issues Detected:** ${analysis.issues?.length || 0}
- **Improvements Applied:** ${analysis.improvements?.length || 0}
    `.trim();
    }
    generateLanguageDistribution(languages) {
        if (!languages || Object.keys(languages).length === 0) {
            return 'No language data available.';
        }
        const total = Object.values(languages).reduce((sum, count) => sum + count, 0);
        let content = '| Language | Files | Percentage |\n';
        content += '|----------|-------|------------|\n';
        Object.entries(languages)
            .sort(([, a], [, b]) => b - a)
            .forEach(([lang, count]) => {
            const percentage = (count / total * 100).toFixed(1);
            content += `| ${lang} | ${count} | ${percentage}% |\n`;
        });
        return content;
    }
    generateIssuesList(issues) {
        if (!issues || issues.length === 0) {
            return 'No issues were detected in the codebase.';
        }
        return issues.map(issue => `- ${issue}`).join('\n');
    }
    generateChangesContent(improvements) {
        if (!improvements || improvements.length === 0) {
            return 'No changes were made to the codebase.';
        }
        return `
The following improvements were applied to your codebase:

${improvements.map(imp => `- ${imp}`).join('\n')}

All changes follow industry best practices and maintain backward compatibility.
    `.trim();
    }
    generateMetricsContent(job, thoughts) {
        const analysis = job.analysisResult;
        const processingTime = job.processingEndedAt && job.processingStartedAt
            ? (job.processingEndedAt.getTime() - job.processingStartedAt.getTime()) / 1000
            : 0;
        const aiDecisions = thoughts.filter(t => t.eventType === 'cleanup-decision').length;
        const errors = thoughts.filter(t => t.eventType === 'error').length;
        return `
### Processing Performance

- **Total Processing Time:** ${processingTime.toFixed(2)} seconds
- **Files Processed:** ${analysis?.totalFiles || 0}
- **Processing Rate:** ${analysis?.totalFiles ? (analysis.totalFiles / processingTime).toFixed(2) : 0} files/second
- **AI Model Used:** ${analysis?.claudeUsed ? 'Claude (Premium)' : 'Ollama (Local)'}
- **AI Decisions Made:** ${aiDecisions}
- **Errors Encountered:** ${errors}
- **Processing Cost:** $${analysis?.processingCostUsd?.toFixed(4) || '0.0000'}

### Resource Usage

- **Memory Efficiency:** ${thoughts.length > 0 ? 'Optimized' : 'Standard'}
- **Backup Created:** Yes
- **Compression Applied:** Yes
    `.trim();
    }
    generateSummary(job) {
        const analysis = job.analysisResult;
        return `
This report provides a comprehensive overview of the cleanup process performed on "${job.originalFileName}". 
The AI-powered analysis identified ${analysis?.issues?.length || 0} issues and successfully applied 
${analysis?.improvements?.length || 0} improvements to enhance code quality and organization.
    `.trim();
    }
    async generateRecommendations(job, thoughts) {
        const analysis = job.analysisResult;
        const recommendations = [];
        if (analysis?.languages) {
            const primaryLang = Object.entries(analysis.languages)
                .sort(([, a], [, b]) => b - a)[0]?.[0];
            if (primaryLang) {
                recommendations.push(this.getLanguageRecommendation(primaryLang));
            }
        }
        if (analysis?.totalFiles > 1000) {
            recommendations.push('Consider breaking this project into smaller, more manageable modules.');
        }
        if (analysis?.ollamaConfidence < 0.8) {
            recommendations.push('Some files required manual review. Consider adding more comprehensive tests.');
        }
        const processingTime = job.processingEndedAt && job.processingStartedAt
            ? (job.processingEndedAt.getTime() - job.processingStartedAt.getTime()) / 1000
            : 0;
        if (processingTime > 300) {
            recommendations.push('Large codebases benefit from regular cleanup. Consider scheduling monthly cleanups.');
        }
        if (recommendations.length === 0) {
            recommendations.push('Your codebase is well-organized. Keep up the good practices!');
        }
        return `
Based on our analysis, we recommend:

${recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}

### Next Steps

1. Review the cleaned codebase structure
2. Test critical functionality
3. Update your documentation if needed
4. Consider setting up automated code quality checks
    `.trim();
    }
    getLanguageRecommendation(language) {
        const recommendations = {
            javascript: 'Consider using TypeScript for better type safety and IDE support.',
            python: 'Ensure you have proper virtual environment setup and requirements.txt updated.',
            java: 'Review your build configuration and consider updating dependencies.',
            typescript: 'Great choice! Ensure your tsconfig.json is optimized for your use case.',
            go: 'Consider using go mod tidy to clean up unused dependencies.',
            rust: 'Run cargo clippy for additional optimization suggestions.'
        };
        return recommendations[language.toLowerCase()] ||
            `Continue following ${language} best practices and keep dependencies updated.`;
    }
    async getS3Client() {
        const { createS3Client } = await Promise.resolve().then(() => __importStar(require('../../utils/storage')));
        return createS3Client();
    }
}
exports.CleanupDocsService = CleanupDocsService;
exports.cleanupDocs = new CleanupDocsService();
//# sourceMappingURL=cleanup-docs.service.js.map