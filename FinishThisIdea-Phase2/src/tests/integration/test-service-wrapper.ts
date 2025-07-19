import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import path from 'path';
import fs from 'fs/promises';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

describe('Soulfra Service Wrapper Integration', () => {
  const testDir = path.join('/tmp', 'test-wrapper-' + uuidv4());
  const testInput = path.join(testDir, 'input.zip');
  const testOutput = path.join(testDir, 'output');

  beforeAll(async () => {
    // Create test directories
    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(testOutput, { recursive: true });

    // Create a simple test zip file
    const testContent = 'console.log("Hello World");';
    const inputFile = path.join(testDir, 'test.js');
    await fs.writeFile(inputFile, testContent);

    // Create zip using native tools
    await new Promise<void>((resolve, reject) => {
      const zip = spawn('zip', ['-j', testInput, inputFile], { cwd: testDir });
      zip.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Zip failed with code ${code}`));
      });
    });
  });

  afterAll(async () => {
    // Cleanup
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should execute wrapper with a simple Python service', async () => {
    // Test with import-optimizer as it's one of the simpler services
    const wrapperPath = path.join(__dirname, '../../../scripts/soulfra-service-wrapper.py');
    const servicePath = path.join(__dirname, '../../soulfra-scripts/import-optimizer.py');

    const result = await new Promise<{ success: boolean; output: string; error: string }>((resolve) => {
      const proc = spawn('python3', [
        wrapperPath,
        servicePath,
        '--input', testInput,
        '--output', testOutput,
        '--job-mode'
      ]);

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        resolve({
          success: code === 0,
          output: stdout,
          error: stderr
        });
      });
    });

    expect(result.success).toBe(true);
    expect(result.output).toContain('progress:');
    expect(result.output).toContain('"success": true');
  }, 30000); // 30 second timeout

  it('should handle progress updates correctly', async () => {
    const wrapperPath = path.join(__dirname, '../../../scripts/soulfra-service-wrapper.py');
    const servicePath = path.join(__dirname, '../../soulfra-scripts/code-cleanup.py');

    const progressUpdates: number[] = [];

    await new Promise<void>((resolve, reject) => {
      const proc = spawn('python3', [
        wrapperPath,
        servicePath,
        '--input', testInput,
        '--output', testOutput,
        '--job-mode'
      ]);

      proc.stdout.on('data', (data) => {
        const output = data.toString();
        const progressMatch = output.match(/progress:\s*(\d+)/g);
        if (progressMatch) {
          progressMatch.forEach(match => {
            const value = parseInt(match.split(':')[1].trim());
            progressUpdates.push(value);
          });
        }
      });

      proc.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Process failed with code ${code}`));
      });
    });

    // Should have progress updates
    expect(progressUpdates.length).toBeGreaterThan(0);
    expect(progressUpdates).toContain(10);
    expect(progressUpdates).toContain(100);
    
    // Progress should be in ascending order
    for (let i = 1; i < progressUpdates.length; i++) {
      expect(progressUpdates[i]).toBeGreaterThanOrEqual(progressUpdates[i - 1]);
    }
  }, 30000);

  it('should create output files', async () => {
    const wrapperPath = path.join(__dirname, '../../../scripts/soulfra-service-wrapper.py');
    const servicePath = path.join(__dirname, '../../soulfra-scripts/documentation-generator.py');

    await new Promise<void>((resolve, reject) => {
      const proc = spawn('python3', [
        wrapperPath,
        servicePath,
        '--input', testInput,
        '--output', testOutput,
        '--job-mode'
      ]);

      proc.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Process failed with code ${code}`));
      });
    });

    // Check that output files were created
    const outputFiles = await fs.readdir(testOutput);
    expect(outputFiles.length).toBeGreaterThan(0);
    
    // Should have at least an output.zip
    const hasOutputZip = outputFiles.some(file => file.endsWith('.zip'));
    expect(hasOutputZip).toBe(true);
  }, 30000);
});