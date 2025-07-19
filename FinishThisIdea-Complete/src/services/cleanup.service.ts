import path from 'path';
import fs from 'fs/promises';
import unzipper from 'unzipper';
import archiver from 'archiver';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { llmRouter } from '../llm/router';
import { prisma } from '../utils/database';
import { uploadToS3, downloadFromS3 } from '../utils/storage';
import { ProcessingError } from '../utils/errors';
import { profileService } from './profile.service';
import { ContextProfile } from '../types/context-profile';
import { cleanupMemory } from './memory/cleanup-memory.service';
import { platformLogger } from './monitoring/platform-logger.service';
import { cleanupBackup } from './backup/cleanup-backup.service';
import { cleanupDocs } from './docs/cleanup-docs.service';
import { achievementService } from './gamification/achievement.service';

// Create service-specific logger
const serviceLogger = platformLogger.createServiceLogger('cleanup-service');

export interface CleanupResult {
  outputFileUrl: string;
  metadata: {
    originalFiles: number;
    cleanedFiles: number;
    linesOfCode: number;
    languages: Record<string, number>;
    improvements: string[];
    processingCost: number;
  };
}

export async function processCleanupJob(
  jobId: string,
  progressCallback?: (progress: number) => void
): Promise<CleanupResult> {
  const updateProgress = (progress: number) => {
    progressCallback?.(progress);
  };

  updateProgress(5);
  
  const startTime = Date.now();

  try {
    // Get job details
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new ProcessingError('Job not found');
    }

    logger.info('Starting cleanup process', { jobId, inputUrl: job.inputFileUrl });
    serviceLogger.info('Starting cleanup process', { jobId, operation: 'cleanup' });

    // Get session ID from job metadata
    const sessionId = (job.metadata as any)?.sessionId || `session-${jobId}`;
    
    // Load user preferences from memory
    const userPreferences = await cleanupMemory.getUserPreferences(sessionId, job.metadata?.userId as string);
    if (userPreferences) {
      logger.info('Loaded user preferences from memory', { 
        sessionId, 
        preferences: userPreferences.preferences 
      });
    }

    // Load context profile if specified
    let profile: ContextProfile | null = null;
    const jobInput = job.input as any;
    if (jobInput?.profileId) {
      profile = await profileService.getProfile(jobInput.profileId, job.userId);
      logger.info('Using context profile', { profileId: jobInput.profileId, profileName: profile?.name });
      
      // Track profile usage and update job
      if (profile) {
        await prisma.contextProfile.updateMany({
          where: { id: jobInput.profileId },
          data: { usageCount: { increment: 1 } },
        });
        
        // Update job to link to profile
        await prisma.job.update({
          where: { id: jobId },
          data: { contextProfileId: jobInput.profileId },
        });
      }
    }

    // Download and extract files
    updateProgress(10);
    const extractedDir = await downloadAndExtract(job.inputFileUrl, jobId);
    
    // Create backup before processing
    updateProgress(15);
    serviceLogger.info('Creating backup before cleanup', { jobId });
    
    try {
      const backupResult = await cleanupBackup.createBackup(jobId, extractedDir, {
        compress: true,
        includeMetadata: true,
        retentionDays: 30
      });
      
      serviceLogger.info('Backup created successfully', {
        jobId,
        backupId: backupResult.backupId,
        size: backupResult.size
      });
      
      // Store backup info in job metadata
      await prisma.job.update({
        where: { id: jobId },
        data: {
          metadata: {
            ...(job.metadata as any || {}),
            backupId: backupResult.backupId,
            backupUrl: backupResult.backupUrl
          }
        }
      });
    } catch (backupError) {
      // Log error but continue - backup is not critical
      serviceLogger.warn('Backup creation failed, continuing without backup', {
        jobId,
        error: backupError.message
      });
    }
    
    updateProgress(20);
    
    // Analyze project structure
    const projectAnalysis = await analyzeProject(extractedDir);
    updateProgress(30);
    
    // Log analysis thought
    await cleanupMemory.logAnalysisThought(jobId, sessionId, {
      ...projectAnalysis,
      startTime: Date.now() - 5000 // Approximate start time
    });
    
    // Clean up files with user preferences
    const cleanupResults = await cleanupFiles(
      extractedDir, 
      projectAnalysis, 
      profile,
      userPreferences?.preferences
    );
    updateProgress(70);
    
    // Log cleanup decision
    await cleanupMemory.logCleanupDecision(jobId, sessionId, {
      confidence: cleanupResults.ollamaConfidence,
      patterns: projectAnalysis.languages ? Object.keys(projectAnalysis.languages) : [],
      issues: cleanupResults.issues,
      fixes: cleanupResults.improvements
    });
    
    // Reorganize structure
    const reorganizedDir = await reorganizeStructure(extractedDir, projectAnalysis);
    updateProgress(85);
    
    // Package results
    const outputUrl = await packageResults(reorganizedDir, jobId);
    updateProgress(95);
    
    // Cleanup temporary files
    await cleanup(extractedDir, reorganizedDir);
    updateProgress(100);

    // Store analysis results
    await prisma.analysisResult.create({
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

    // Save user preferences for future use
    await cleanupMemory.saveUserPreferences(jobId, sessionId, job.metadata?.userId as string);
    
    // Log completion
    await cleanupMemory.logThought({
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

    // Track performance
    const duration = Date.now() - startTime;
    await serviceLogger.track('cleanup-job-complete', duration, { 
      jobId,
      filesProcessed: projectAnalysis.totalFiles,
      cleanedFiles: cleanupResults.cleanedFiles
    });

    // Generate report automatically for completed jobs
    try {
      const reportResult = await cleanupDocs.generateCleanupReport(jobId, {
        format: 'markdown',
        includeAnalysis: true,
        includeChangelog: true,
        includeMetrics: true,
        includeRecommendations: true,
        branding: true
      });
      
      logger.info('Auto-generated cleanup report', { 
        jobId, 
        reportId: reportResult.reportId 
      });
    } catch (reportError) {
      // Don't fail the job if report generation fails
      logger.error('Failed to auto-generate report', { 
        jobId, 
        error: reportError.message 
      });
    }

    // Check for achievements (if user ID is available)
    const userId = job.userId || (job.metadata as any)?.userId;
    if (userId) {
      try {
        const unlockedAchievements = await achievementService.checkAchievements(userId, jobId);
        
        if (unlockedAchievements.length > 0) {
          logger.info('Achievements unlocked', {
            jobId,
            userId,
            achievements: unlockedAchievements.map(a => a.id)
          });
          
          // Store achievement info in job metadata for frontend notification
          await prisma.job.update({
            where: { id: jobId },
            data: {
              metadata: {
                ...(job.metadata as any || {}),
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
      } catch (achievementError) {
        // Don't fail the job if achievement check fails
        logger.error('Failed to check achievements', {
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

  } catch (error) {
    logger.error('Cleanup job failed', { jobId, error });
    
    // Log error with recovery information
    await serviceLogger.error(error, 
      { jobId, sessionId, operation: 'cleanup' },
      { 
        attempted: true, 
        successful: false, 
        strategy: 'Job will be retried by queue' 
      }
    );
    
    // Log error thought
    await cleanupMemory.logThought({
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

async function downloadAndExtract(fileUrl: string, jobId: string): Promise<string> {
  const tempDir = path.join('/tmp', `cleanup-${jobId}`);
  const extractDir = path.join(tempDir, 'extracted');
  
  await fs.mkdir(extractDir, { recursive: true });
  
  // Download file from S3
  const fileBuffer = await downloadFromS3(fileUrl);
  const zipPath = path.join(tempDir, 'input.zip');
  
  await fs.writeFile(zipPath, fileBuffer);
  
  // Extract zip file
  await fs.createReadStream(zipPath)
    .pipe(unzipper.Extract({ path: extractDir }))
    .promise();
  
  logger.info('Files extracted', { extractDir, jobId });
  return extractDir;
}

async function analyzeProject(projectDir: string): Promise<{
  totalFiles: number;
  linesOfCode: number;
  languages: Record<string, number>;
  fileTypes: Record<string, number>;
  structure: string[];
}> {
  const files = await getAllFiles(projectDir);
  const languages: Record<string, number> = {};
  const fileTypes: Record<string, number> = {};
  let totalLines = 0;

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    fileTypes[ext] = (fileTypes[ext] || 0) + 1;

    // Detect language
    const language = detectLanguage(ext);
    if (language) {
      languages[language] = (languages[language] || 0) + 1;
    }

    // Count lines (for text files only)
    if (isTextFile(ext)) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        totalLines += content.split('\n').length;
      } catch (error) {
        // Skip binary or problematic files
      }
    }
  }

  return {
    totalFiles: files.length,
    linesOfCode: totalLines,
    languages,
    fileTypes,
    structure: files.map(f => path.relative(projectDir, f)),
  };
}

async function cleanupFiles(
  projectDir: string, 
  analysis: any, 
  profile: ContextProfile | null,
  userPreferences?: any
): Promise<{
  cleanedFiles: number;
  issues: string[];
  improvements: string[];
  ollamaConfidence: number;
  claudeUsed: boolean;
  cost: number;
}> {
  const files = await getAllFiles(projectDir);
  let cleanedFiles = 0;
  let totalCost = 0;
  let claudeUsed = false;
  let minConfidence = 1.0;
  const allIssues: string[] = [];
  const allImprovements: string[] = [];

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    
    // Only process code files
    if (!isCodeFile(ext)) continue;

    try {
      const content = await fs.readFile(file, 'utf-8');
      
      // Skip empty files
      if (content.trim().length === 0) continue;

      // Analyze file
      const analysisResult = await llmRouter.route({
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

      // Clean up file if issues found
      if (analysisResult.data.issues?.length > 0) {
        const cleanupResult = await llmRouter.route({
          type: 'cleanup',
          input: { 
            code: content, 
            language: detectLanguage(ext) || 'text' 
          },
          options: { preferLocal: true, maxCost: 0.1, profile }
        });

        // Write cleaned file
        await fs.writeFile(file, cleanupResult.data);
        cleanedFiles++;
        totalCost += cleanupResult.cost;
        
        if (cleanupResult.provider === 'claude') {
          claudeUsed = true;
        }

        allImprovements.push(`Cleaned ${path.basename(file)}`);
      }

    } catch (error) {
      logger.error('Failed to clean file', { file, error });
      allIssues.push(`Failed to process ${path.basename(file)}`);
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

async function reorganizeStructure(projectDir: string, analysis: any): Promise<string> {
  const files = analysis.structure;
  
  // Get structure suggestion from LLM
  const structureResult = await llmRouter.route({
    type: 'structure',
    input: { files },
    options: { preferLocal: true, maxCost: 0.05 }
  });

  const suggestion = structureResult.data;
  const reorganizedDir = path.join(path.dirname(projectDir), 'reorganized');
  
  await fs.mkdir(reorganizedDir, { recursive: true });

  // Apply suggested structure
  for (const [folder, folderFiles] of Object.entries(suggestion.structure)) {
    const folderPath = path.join(reorganizedDir, folder);
    await fs.mkdir(folderPath, { recursive: true });

    for (const file of folderFiles as string[]) {
      const sourcePath = path.join(projectDir, file);
      const destPath = path.join(folderPath, path.basename(file));
      
      try {
        await fs.copyFile(sourcePath, destPath);
      } catch (error) {
        logger.warn('Failed to copy file during reorganization', { 
          source: sourcePath, 
          dest: destPath, 
          error 
        });
      }
    }
  }

  // Generate README with improvements
  const readmePath = path.join(reorganizedDir, 'README.md');
  const readmeContent = generateReadme(analysis, suggestion);
  await fs.writeFile(readmePath, readmeContent);

  return reorganizedDir;
}

async function packageResults(projectDir: string, jobId: string): Promise<string> {
  const zipPath = path.join('/tmp', `cleaned-${jobId}.zip`);
  
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  archive.pipe(output);
  archive.directory(projectDir, false);
  await archive.finalize();
  
  // Upload to S3
  const fileBuffer = await fs.readFile(zipPath);
  const s3Key = `results/${jobId}/cleaned-codebase.zip`;
  const uploadUrl = await uploadToS3(fileBuffer, s3Key);
  
  // Cleanup local zip
  await fs.unlink(zipPath);
  
  return uploadUrl;
}

async function cleanup(...dirs: string[]) {
  for (const dir of dirs) {
    try {
      await fs.rm(dir, { recursive: true, force: true });
    } catch (error) {
      logger.warn('Failed to cleanup temp directory', { dir, error });
    }
  }
}

// Helper functions
async function getAllFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  
  async function scan(currentDir: string) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip common ignore directories
        if (!shouldIgnoreDir(entry.name)) {
          await scan(fullPath);
        }
      } else {
        files.push(fullPath);
      }
    }
  }
  
  await scan(dir);
  return files;
}

function shouldIgnoreDir(dirName: string): boolean {
  const ignoreDirs = [
    'node_modules', '.git', '.svn', '.hg', 'dist', 'build', 
    'coverage', '.nyc_output', 'logs', 'tmp', 'temp', '.cache'
  ];
  return ignoreDirs.includes(dirName) || dirName.startsWith('.');
}

function detectLanguage(ext: string): string | null {
  const languageMap: Record<string, string> = {
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

function isTextFile(ext: string): boolean {
  const textExts = [
    '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.cs',
    '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala', '.html',
    '.css', '.scss', '.sass', '.json', '.xml', '.yaml', '.yml', '.md',
    '.txt', '.csv', '.sql', '.sh', '.bat', '.ps1', '.dockerfile',
  ];
  
  return textExts.includes(ext.toLowerCase());
}

function isCodeFile(ext: string): boolean {
  const codeExts = [
    '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.cs',
    '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala', '.css', 
    '.scss', '.sass', '.json', '.sql',
  ];
  
  return codeExts.includes(ext.toLowerCase());
}

function generateReadme(analysis: any, structure: any): string {
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
  .map(([folder, files]) => `${folder}\n${(files as string[]).map(f => `  ├── ${f}`).join('\n')}`)
  .join('\n\n')}
\`\`\`

## Notes

${structure.reasoning || 'Files have been organized following best practices for the detected languages.'}

---

*Cleaned by [FinishThisIdea](https://finishthisidea.com) - AI-powered codebase cleanup*
`;
}