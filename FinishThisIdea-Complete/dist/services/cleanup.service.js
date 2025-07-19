"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processCleanupJob = processCleanupJob;
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const unzipper_1 = __importDefault(require("unzipper"));
const archiver_1 = __importDefault(require("archiver"));
const logger_1 = require("../utils/logger");
const router_1 = require("../llm/router");
const database_1 = require("../utils/database");
const storage_1 = require("../utils/storage");
const errors_1 = require("../utils/errors");
const profile_service_1 = require("./profile.service");
const cleanup_memory_service_1 = require("./memory/cleanup-memory.service");
const platform_logger_service_1 = require("./monitoring/platform-logger.service");
const cleanup_backup_service_1 = require("./backup/cleanup-backup.service");
const cleanup_docs_service_1 = require("./docs/cleanup-docs.service");
const achievement_service_1 = require("./gamification/achievement.service");
const serviceLogger = platform_logger_service_1.platformLogger.createServiceLogger('cleanup-service');
async function processCleanupJob(jobId, progressCallback) {
    const updateProgress = (progress) => {
        progressCallback?.(progress);
    };
    updateProgress(5);
    const startTime = Date.now();
    try {
        const job = await database_1.prisma.job.findUnique({
            where: { id: jobId },
        });
        if (!job) {
            throw new errors_1.ProcessingError('Job not found');
        }
        logger_1.logger.info('Starting cleanup process', { jobId, inputUrl: job.inputFileUrl });
        serviceLogger.info('Starting cleanup process', { jobId, operation: 'cleanup' });
        const sessionId = job.metadata?.sessionId || `session-${jobId}`;
        const userPreferences = await cleanup_memory_service_1.cleanupMemory.getUserPreferences(sessionId, job.metadata?.userId);
        if (userPreferences) {
            logger_1.logger.info('Loaded user preferences from memory', {
                sessionId,
                preferences: userPreferences.preferences
            });
        }
        let profile = null;
        const jobInput = job.input;
        if (jobInput?.profileId) {
            profile = await profile_service_1.profileService.getProfile(jobInput.profileId, job.userId);
            logger_1.logger.info('Using context profile', { profileId: jobInput.profileId, profileName: profile?.name });
            if (profile) {
                await database_1.prisma.contextProfile.updateMany({
                    where: { id: jobInput.profileId },
                    data: { usageCount: { increment: 1 } },
                });
                await database_1.prisma.job.update({
                    where: { id: jobId },
                    data: { contextProfileId: jobInput.profileId },
                });
            }
        }
        updateProgress(10);
        const extractedDir = await downloadAndExtract(job.inputFileUrl, jobId);
        updateProgress(15);
        serviceLogger.info('Creating backup before cleanup', { jobId });
        try {
            const backupResult = await cleanup_backup_service_1.cleanupBackup.createBackup(jobId, extractedDir, {
                compress: true,
                includeMetadata: true,
                retentionDays: 30
            });
            serviceLogger.info('Backup created successfully', {
                jobId,
                backupId: backupResult.backupId,
                size: backupResult.size
            });
            await database_1.prisma.job.update({
                where: { id: jobId },
                data: {
                    metadata: {
                        ...(job.metadata || {}),
                        backupId: backupResult.backupId,
                        backupUrl: backupResult.backupUrl
                    }
                }
            });
        }
        catch (backupError) {
            serviceLogger.warn('Backup creation failed, continuing without backup', {
                jobId,
                error: backupError.message
            });
        }
        updateProgress(20);
        const projectAnalysis = await analyzeProject(extractedDir);
        updateProgress(30);
        await cleanup_memory_service_1.cleanupMemory.logAnalysisThought(jobId, sessionId, {
            ...projectAnalysis,
            startTime: Date.now() - 5000
        });
        const cleanupResults = await cleanupFiles(extractedDir, projectAnalysis, profile, userPreferences?.preferences);
        updateProgress(70);
        await cleanup_memory_service_1.cleanupMemory.logCleanupDecision(jobId, sessionId, {
            confidence: cleanupResults.ollamaConfidence,
            patterns: projectAnalysis.languages ? Object.keys(projectAnalysis.languages) : [],
            issues: cleanupResults.issues,
            fixes: cleanupResults.improvements
        });
        const reorganizedDir = await reorganizeStructure(extractedDir, projectAnalysis);
        updateProgress(85);
        const outputUrl = await packageResults(reorganizedDir, jobId);
        updateProgress(95);
        await cleanup(extractedDir, reorganizedDir);
        updateProgress(100);
        await database_1.prisma.analysisResult.create({
            data: {
                jobId,
                totalFiles: projectAnalysis.totalFiles,
                linesOfCode: projectAnalysis.linesOfCode,
                languages: projectAnalysis.languages,
                issues: cleanupResults.issues,
                improvements: cleanupResults.improvements,
                ollamaConfidence: cleanupResults.ollamaConfidence,
                claudeUsed: cleanupResults.claudeUsed,
                processingCostUsd: cleanupResults.cost,
            },
        });
        await cleanup_memory_service_1.cleanupMemory.saveUserPreferences(jobId, sessionId, job.metadata?.userId);
        await cleanup_memory_service_1.cleanupMemory.logThought({
            jobId,
            sessionId,
            eventType: 'completion',
            reasoning: {
                intent: 'Successfully completed cleanup',
                confidence: 0.95,
                decisionPath: ['Analysis', 'Cleanup', 'Reorganization', 'Packaging'],
                alternativesConsidered: []
            },
            learning: {
                newPatterns: Object.keys(projectAnalysis.languages || {}),
                improvementNotes: cleanupResults.improvements
            }
        });
        const duration = Date.now() - startTime;
        await serviceLogger.track('cleanup-job-complete', duration, {
            jobId,
            filesProcessed: projectAnalysis.totalFiles,
            cleanedFiles: cleanupResults.cleanedFiles
        });
        try {
            const reportResult = await cleanup_docs_service_1.cleanupDocs.generateCleanupReport(jobId, {
                format: 'markdown',
                includeAnalysis: true,
                includeChangelog: true,
                includeMetrics: true,
                includeRecommendations: true,
                branding: true
            });
            logger_1.logger.info('Auto-generated cleanup report', {
                jobId,
                reportId: reportResult.reportId
            });
        }
        catch (reportError) {
            logger_1.logger.error('Failed to auto-generate report', {
                jobId,
                error: reportError.message
            });
        }
        const userId = job.userId || job.metadata?.userId;
        if (userId) {
            try {
                const unlockedAchievements = await achievement_service_1.achievementService.checkAchievements(userId, jobId);
                if (unlockedAchievements.length > 0) {
                    logger_1.logger.info('Achievements unlocked', {
                        jobId,
                        userId,
                        achievements: unlockedAchievements.map(a => a.id)
                    });
                    await database_1.prisma.job.update({
                        where: { id: jobId },
                        data: {
                            metadata: {
                                ...(job.metadata || {}),
                                unlockedAchievements: unlockedAchievements.map(a => ({
                                    id: a.id,
                                    title: a.title,
                                    description: a.description,
                                    rarity: a.rarity,
                                    xpValue: a.xpValue
                                }))
                            }
                        }
                    });
                }
            }
            catch (achievementError) {
                logger_1.logger.error('Failed to check achievements', {
                    jobId,
                    userId,
                    error: achievementError.message
                });
            }
        }
        return {
            outputFileUrl: outputUrl,
            metadata: {
                originalFiles: projectAnalysis.totalFiles,
                cleanedFiles: cleanupResults.cleanedFiles,
                linesOfCode: projectAnalysis.linesOfCode,
                languages: projectAnalysis.languages,
                improvements: cleanupResults.improvements,
                processingCost: cleanupResults.cost,
            },
        };
    }
    catch (error) {
        logger_1.logger.error('Cleanup job failed', { jobId, error });
        await serviceLogger.error(error, { jobId, sessionId, operation: 'cleanup' }, {
            attempted: true,
            successful: false,
            strategy: 'Job will be retried by queue'
        });
        await cleanup_memory_service_1.cleanupMemory.logThought({
            jobId,
            sessionId,
            eventType: 'error',
            reasoning: {
                intent: 'Error occurred during cleanup',
                confidence: 0.1,
                decisionPath: ['Error detected', 'Logged for analysis'],
                alternativesConsidered: []
            },
            systemState: {
                processingTimeMs: Date.now() - startTime,
                filesAnalyzed: 0,
                aiProvider: 'ollama',
                memoryUsageMb: process.memoryUsage().heapUsed / 1024 / 1024
            }
        });
        throw error;
    }
}
async function downloadAndExtract(fileUrl, jobId) {
    const tempDir = path_1.default.join('/tmp', `cleanup-${jobId}`);
    const extractDir = path_1.default.join(tempDir, 'extracted');
    await promises_1.default.mkdir(extractDir, { recursive: true });
    const fileBuffer = await (0, storage_1.downloadFromS3)(fileUrl);
    const zipPath = path_1.default.join(tempDir, 'input.zip');
    await promises_1.default.writeFile(zipPath, fileBuffer);
    await promises_1.default.createReadStream(zipPath)
        .pipe(unzipper_1.default.Extract({ path: extractDir }))
        .promise();
    logger_1.logger.info('Files extracted', { extractDir, jobId });
    return extractDir;
}
async function analyzeProject(projectDir) {
    const files = await getAllFiles(projectDir);
    const languages = {};
    const fileTypes = {};
    let totalLines = 0;
    for (const file of files) {
        const ext = path_1.default.extname(file).toLowerCase();
        fileTypes[ext] = (fileTypes[ext] || 0) + 1;
        const language = detectLanguage(ext);
        if (language) {
            languages[language] = (languages[language] || 0) + 1;
        }
        if (isTextFile(ext)) {
            try {
                const content = await promises_1.default.readFile(file, 'utf-8');
                totalLines += content.split('\n').length;
            }
            catch (error) {
            }
        }
    }
    return {
        totalFiles: files.length,
        linesOfCode: totalLines,
        languages,
        fileTypes,
        structure: files.map(f => path_1.default.relative(projectDir, f)),
    };
}
async function cleanupFiles(projectDir, analysis, profile, userPreferences) {
    const files = await getAllFiles(projectDir);
    let cleanedFiles = 0;
    let totalCost = 0;
    let claudeUsed = false;
    let minConfidence = 1.0;
    const allIssues = [];
    const allImprovements = [];
    for (const file of files) {
        const ext = path_1.default.extname(file).toLowerCase();
        if (!isCodeFile(ext))
            continue;
        try {
            const content = await promises_1.default.readFile(file, 'utf-8');
            if (content.trim().length === 0)
                continue;
            const analysisResult = await router_1.llmRouter.route({
                type: 'analyze',
                input: { code: content },
                options: { preferLocal: true, maxCost: 0.05, profile }
            });
            allIssues.push(...(analysisResult.data.issues || []));
            minConfidence = Math.min(minConfidence, analysisResult.confidence);
            totalCost += analysisResult.cost;
            if (analysisResult.provider === 'claude') {
                claudeUsed = true;
            }
            if (analysisResult.data.issues?.length > 0) {
                const cleanupResult = await router_1.llmRouter.route({
                    type: 'cleanup',
                    input: {
                        code: content,
                        language: detectLanguage(ext) || 'text'
                    },
                    options: { preferLocal: true, maxCost: 0.1, profile }
                });
                await promises_1.default.writeFile(file, cleanupResult.data);
                cleanedFiles++;
                totalCost += cleanupResult.cost;
                if (cleanupResult.provider === 'claude') {
                    claudeUsed = true;
                }
                allImprovements.push(`Cleaned ${path_1.default.basename(file)}`);
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to clean file', { file, error });
            allIssues.push(`Failed to process ${path_1.default.basename(file)}`);
        }
    }
    return {
        cleanedFiles,
        issues: allIssues,
        improvements: allImprovements,
        ollamaConfidence: minConfidence,
        claudeUsed,
        cost: totalCost,
    };
}
async function reorganizeStructure(projectDir, analysis) {
    const files = analysis.structure;
    const structureResult = await router_1.llmRouter.route({
        type: 'structure',
        input: { files },
        options: { preferLocal: true, maxCost: 0.05 }
    });
    const suggestion = structureResult.data;
    const reorganizedDir = path_1.default.join(path_1.default.dirname(projectDir), 'reorganized');
    await promises_1.default.mkdir(reorganizedDir, { recursive: true });
    for (const [folder, folderFiles] of Object.entries(suggestion.structure)) {
        const folderPath = path_1.default.join(reorganizedDir, folder);
        await promises_1.default.mkdir(folderPath, { recursive: true });
        for (const file of folderFiles) {
            const sourcePath = path_1.default.join(projectDir, file);
            const destPath = path_1.default.join(folderPath, path_1.default.basename(file));
            try {
                await promises_1.default.copyFile(sourcePath, destPath);
            }
            catch (error) {
                logger_1.logger.warn('Failed to copy file during reorganization', {
                    source: sourcePath,
                    dest: destPath,
                    error
                });
            }
        }
    }
    const readmePath = path_1.default.join(reorganizedDir, 'README.md');
    const readmeContent = generateReadme(analysis, suggestion);
    await promises_1.default.writeFile(readmePath, readmeContent);
    return reorganizedDir;
}
async function packageResults(projectDir, jobId) {
    const zipPath = path_1.default.join('/tmp', `cleaned-${jobId}.zip`);
    const output = promises_1.default.createWriteStream(zipPath);
    const archive = (0, archiver_1.default)('zip', { zlib: { level: 9 } });
    archive.pipe(output);
    archive.directory(projectDir, false);
    await archive.finalize();
    const fileBuffer = await promises_1.default.readFile(zipPath);
    const s3Key = `results/${jobId}/cleaned-codebase.zip`;
    const uploadUrl = await (0, storage_1.uploadToS3)(fileBuffer, s3Key);
    await promises_1.default.unlink(zipPath);
    return uploadUrl;
}
async function cleanup(...dirs) {
    for (const dir of dirs) {
        try {
            await promises_1.default.rm(dir, { recursive: true, force: true });
        }
        catch (error) {
            logger_1.logger.warn('Failed to cleanup temp directory', { dir, error });
        }
    }
}
async function getAllFiles(dir) {
    const files = [];
    async function scan(currentDir) {
        const entries = await promises_1.default.readdir(currentDir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path_1.default.join(currentDir, entry.name);
            if (entry.isDirectory()) {
                if (!shouldIgnoreDir(entry.name)) {
                    await scan(fullPath);
                }
            }
            else {
                files.push(fullPath);
            }
        }
    }
    await scan(dir);
    return files;
}
function shouldIgnoreDir(dirName) {
    const ignoreDirs = [
        'node_modules', '.git', '.svn', '.hg', 'dist', 'build',
        'coverage', '.nyc_output', 'logs', 'tmp', 'temp', '.cache'
    ];
    return ignoreDirs.includes(dirName) || dirName.startsWith('.');
}
function detectLanguage(ext) {
    const languageMap = {
        '.js': 'javascript',
        '.jsx': 'javascript',
        '.ts': 'typescript',
        '.tsx': 'typescript',
        '.py': 'python',
        '.java': 'java',
        '.cpp': 'cpp',
        '.c': 'c',
        '.cs': 'csharp',
        '.php': 'php',
        '.rb': 'ruby',
        '.go': 'go',
        '.rs': 'rust',
        '.swift': 'swift',
        '.kt': 'kotlin',
        '.scala': 'scala',
        '.html': 'html',
        '.css': 'css',
        '.scss': 'scss',
        '.sass': 'sass',
        '.json': 'json',
        '.xml': 'xml',
        '.yaml': 'yaml',
        '.yml': 'yaml',
    };
    return languageMap[ext] || null;
}
function isTextFile(ext) {
    const textExts = [
        '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.cs',
        '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala', '.html',
        '.css', '.scss', '.sass', '.json', '.xml', '.yaml', '.yml', '.md',
        '.txt', '.csv', '.sql', '.sh', '.bat', '.ps1', '.dockerfile',
    ];
    return textExts.includes(ext.toLowerCase());
}
function isCodeFile(ext) {
    const codeExts = [
        '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.cs',
        '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala', '.css',
        '.scss', '.sass', '.json', '.sql',
    ];
    return codeExts.includes(ext.toLowerCase());
}
function generateReadme(analysis, structure) {
    return `# Cleaned Codebase

This codebase has been automatically cleaned and organized by FinishThisIdea.

## Project Statistics

- **Total Files**: ${analysis.totalFiles}
- **Lines of Code**: ${analysis.linesOfCode.toLocaleString()}
- **Languages**: ${Object.keys(analysis.languages).join(', ')}

## Improvements Made

- Organized files into logical folder structure
- Removed unused imports and dead code
- Fixed indentation and formatting
- Applied language-specific best practices

## Project Structure

\`\`\`
${Object.entries(structure.structure)
        .map(([folder, files]) => `${folder}\n${files.map(f => `  ├── ${f}`).join('\n')}`)
        .join('\n\n')}
\`\`\`

## Notes

${structure.reasoning || 'Files have been organized following best practices for the detected languages.'}

---

*Cleaned by [FinishThisIdea](https://finishthisidea.com) - AI-powered codebase cleanup*
`;
}
//# sourceMappingURL=cleanup.service.js.map