import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { prisma } from '../utils/database';
import { uploadToS3, downloadFromS3 } from '../utils/storage';
import { ProcessingError } from '../utils/errors';
import { spawn } from 'child_process';

export interface CodeNavigationConfig {
  [key: string]: any;
}

export interface CodeNavigationResult {
  outputFileUrl: string;
  metadata: any;
  processingCost: number;
}

/**
 * Code Navigation Service
 * Price: $2.0
 * CODE GPS MVP - Visualize and Fix Your Codebase Chaos
 */
export async function processCodeNavigation(
  jobId: string,
  config: CodeNavigationConfig,
  progressCallback?: (progress: number) => void
): Promise<CodeNavigationResult> {
  const updateProgress = (progress: number) => {
    progressCallback?.(progress);
  };

  updateProgress(5);

  try {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new ProcessingError('Job not found');

    logger.info('Starting codeNavigation processing', { jobId });

    // Download and process
    const inputBuffer = await downloadFromS3(job.inputFileUrl);
    const tempDir = path.join('/tmp', `codeNavigation-${jobId}`);
    await fs.mkdir(tempDir, { recursive: true });
    
    const inputPath = path.join(tempDir, 'input.zip');
    await fs.writeFile(inputPath, inputBuffer);
    
    updateProgress(20);
    
    // Call Soulfra service via wrapper
    const result = await new Promise<any>((resolve, reject) => {
      const proc = spawn('python3', [
        path.join(__dirname, '../../scripts/soulfra-service-wrapper.py'),
        path.join(__dirname, '../soulfra-scripts/code-navigation.py'),
        '--input', inputPath,
        '--output', tempDir,
        '--job-mode'
      ]);
      
      let output = '';
      proc.stdout.on('data', (data) => {
        const str = data.toString();
        output += str;
        const match = str.match(/progress: (\d+)/);
        if (match) updateProgress(20 + (parseInt(match[1]) * 0.6));
      });
      
      proc.stderr.on('data', (data) => console.error(data.toString()));
      
      proc.on('close', (code) => {
        if (code !== 0) reject(new Error('Processing failed'));
        else {
          const jsonMatch = output.match(/\{[^{}]*\}/);
          resolve(jsonMatch ? JSON.parse(jsonMatch[0]) : { success: true });
        }
      });
    });
    
    updateProgress(80);
    
    // Upload result
    const outputPath = path.join(tempDir, 'output.zip');
    if (!(await fs.stat(outputPath).catch(() => null))) {
      // Create output zip if not exists
      const archiver = await import('archiver');
      const output = fs.createWriteStream(outputPath);
      const archive = archiver.create('zip', { zlib: { level: 9 } });
      archive.pipe(output);
      archive.directory(tempDir, false);
      await archive.finalize();
    }
    
    const outputBuffer = await fs.readFile(outputPath);
    const outputUrl = await uploadToS3(outputBuffer, `codeNavigation/${jobId}/output.zip`);
    
    await fs.rm(tempDir, { recursive: true, force: true });
    updateProgress(100);
    
    return {
      outputFileUrl: outputUrl,
      metadata: result.metadata || {},
      processingCost: 0.001
    };
    
  } catch (error) {
    logger.error('codeNavigation processing failed', { jobId, error });
    throw error;
  }
}
