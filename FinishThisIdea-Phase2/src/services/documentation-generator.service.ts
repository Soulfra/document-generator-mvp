import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { llmRouter } from '../llm/router';
import { prisma } from '../utils/database';
import { uploadToS3, downloadFromS3 } from '../utils/storage';
import { ProcessingError } from '../utils/errors';
import { marked } from 'marked';
import archiver from 'archiver';

export interface DocumentationConfig {
  includeReadme: boolean;
  includeApiDocs: boolean;
  includeSetupGuide: boolean;
  includeExamples: boolean;
  includeChangelog: boolean;
  includeContributing: boolean;
  docStyle: 'basic' | 'professional' | 'enterprise';
  targetAudience: 'developers' | 'users' | 'both';
}

export interface DocumentationResult {
  outputFileUrl: string;
  generatedFiles: string[];
  docQualityScore: number;
  processingCost: number;
}

export async function generateDocumentation(
  jobId: string,
  config: DocumentationConfig,
  progressCallback?: (progress: number) => void
): Promise<DocumentationResult> {
  const updateProgress = (progress: number) => {
    progressCallback?.(progress);
  };

  updateProgress(5);

  try {
    // Get job details
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { analysisResult: true },
    });

    if (!job) {
      throw new ProcessingError('Job not found');
    }

    logger.info('Starting documentation generation', { jobId, config });

    // Download source code
    updateProgress(10);
    const sourceDir = await downloadAndExtract(job.inputFileUrl, jobId);
    
    updateProgress(20);
    
    // Analyze codebase for documentation
    const codeAnalysis = await analyzeCodebaseForDocs(sourceDir);
    updateProgress(30);
    
    // Generate documentation components
    const docComponents = await generateDocumentationComponents(sourceDir, codeAnalysis, config);
    updateProgress(70);
    
    // Package documentation
    const outputUrl = await packageDocumentation(docComponents, jobId);
    updateProgress(90);
    
    // Store results
    await prisma.documentationResult.create({
      data: {
        jobId,
        readmeContent: docComponents.readme,
        apiDocsContent: docComponents.apiDocs,
        setupGuideContent: docComponents.setupGuide,
        examplesContent: docComponents.examples,
        generatedFiles: docComponents.files,
        docQualityScore: docComponents.qualityScore,
        processingCostUsd: docComponents.totalCost,
      },
    });

    // Cleanup
    await cleanup(sourceDir);
    updateProgress(100);

    return {
      outputFileUrl: outputUrl,
      generatedFiles: docComponents.files,
      docQualityScore: docComponents.qualityScore,
      processingCost: docComponents.totalCost,
    };

  } catch (error) {
    logger.error('Documentation generation failed', { jobId, error });
    throw error;
  }
}

async function downloadAndExtract(fileUrl: string, jobId: string): Promise<string> {
  const tempDir = path.join('/tmp', `docs-${jobId}`);
  const extractDir = path.join(tempDir, 'source');
  
  await fs.mkdir(extractDir, { recursive: true });
  
  // Download and extract source code
  const fileBuffer = await downloadFromS3(fileUrl);
  const zipPath = path.join(tempDir, 'source.zip');
  
  await fs.writeFile(zipPath, fileBuffer);
  
  const unzipper = await import('unzipper');
  await fs.createReadStream(zipPath)
    .pipe(unzipper.Extract({ path: extractDir }))
    .promise();
  
  return extractDir;
}

async function analyzeCodebaseForDocs(sourceDir: string): Promise<{
  projectType: string;
  mainLanguage: string;
  packageInfo: any;
  entryPoints: string[];
  apiEndpoints: any[];
  dependencies: any;
  testFiles: string[];
  configFiles: string[];
}> {
  const files = await getAllFiles(sourceDir);
  
  // Detect project type and main language
  const projectType = await detectProjectType(files);
  const mainLanguage = detectMainLanguage(files);
  
  // Parse package.json or equivalent
  const packageInfo = await parsePackageInfo(sourceDir, projectType);
  
  // Find entry points
  const entryPoints = findEntryPoints(files, projectType);
  
  // Extract API endpoints if applicable
  const apiEndpoints = await extractApiEndpoints(files);
  
  // Find test and config files
  const testFiles = files.filter(f => isTestFile(f));
  const configFiles = files.filter(f => isConfigFile(f));
  
  return {
    projectType,
    mainLanguage,
    packageInfo,
    entryPoints,
    apiEndpoints,
    dependencies: packageInfo?.dependencies || {},
    testFiles,
    configFiles,
  };
}

async function generateDocumentationComponents(
  sourceDir: string,
  analysis: any,
  config: DocumentationConfig
): Promise<{
  readme: string;
  apiDocs?: string;
  setupGuide?: string;
  examples?: string;
  changelog?: string;
  contributing?: string;
  files: string[];
  qualityScore: number;
  totalCost: number;
}> {
  let totalCost = 0;
  const files: string[] = [];
  
  // Generate README.md
  let readme = '';
  if (config.includeReadme) {
    const readmeResult = await llmRouter.route({
      type: 'generate',
      input: {
        prompt: buildReadmePrompt(analysis, config),
      },
      options: { preferLocal: true, maxCost: 0.15 }
    });
    readme = readmeResult.data;
    totalCost += readmeResult.cost;
    files.push('README.md');
  }
  
  // Generate API documentation
  let apiDocs;
  if (config.includeApiDocs && analysis.apiEndpoints.length > 0) {
    const apiDocsResult = await llmRouter.route({
      type: 'generate',
      input: {
        prompt: buildApiDocsPrompt(analysis, config),
      },
      options: { preferLocal: true, maxCost: 0.20 }
    });
    apiDocs = apiDocsResult.data;
    totalCost += apiDocsResult.cost;
    files.push('API.md');
  }
  
  // Generate setup guide
  let setupGuide;
  if (config.includeSetupGuide) {
    const setupResult = await llmRouter.route({
      type: 'generate',
      input: {
        prompt: buildSetupGuidePrompt(analysis, config),
      },
      options: { preferLocal: true, maxCost: 0.10 }
    });
    setupGuide = setupResult.data;
    totalCost += setupResult.cost;
    files.push('SETUP.md');
  }
  
  // Generate examples
  let examples;
  if (config.includeExamples) {
    const examplesResult = await llmRouter.route({
      type: 'generate',
      input: {
        prompt: buildExamplesPrompt(analysis, config),
      },
      options: { preferLocal: true, maxCost: 0.15 }
    });
    examples = examplesResult.data;
    totalCost += examplesResult.cost;
    files.push('EXAMPLES.md');
  }
  
  // Calculate quality score based on completeness and analysis
  const qualityScore = calculateDocQualityScore({
    readme,
    apiDocs,
    setupGuide,
    examples,
    analysis,
    config,
  });
  
  return {
    readme,
    apiDocs,
    setupGuide,
    examples,
    files,
    qualityScore,
    totalCost,
  };
}

function buildReadmePrompt(analysis: any, config: DocumentationConfig): string {
  return `Generate a comprehensive README.md for this ${analysis.projectType} project.

Project Info:
- Language: ${analysis.mainLanguage}
- Type: ${analysis.projectType}
- Dependencies: ${Object.keys(analysis.dependencies).slice(0, 10).join(', ')}
- Entry Points: ${analysis.entryPoints.join(', ')}
- API Endpoints: ${analysis.apiEndpoints.length} endpoints found

Style: ${config.docStyle}
Target Audience: ${config.targetAudience}

Include these sections:
1. Project title and description
2. Features list
3. Installation instructions
4. Basic usage examples
5. API reference (if applicable)
6. Configuration options
7. Contributing guidelines
8. License information

Write in clear, professional language that a ${config.targetAudience === 'users' ? 'non-technical user' : 'developer'} can understand.
Use proper Markdown formatting with headers, code blocks, and lists.
Make it engaging and helpful.`;
}

function buildApiDocsPrompt(analysis: any, config: DocumentationConfig): string {
  return `Generate comprehensive API documentation for this ${analysis.projectType} project.

API Endpoints Found:
${analysis.apiEndpoints.map((ep: any) => `- ${ep.method} ${ep.path}: ${ep.description || 'No description'}`).join('\n')}

Generate documentation that includes:
1. API Overview
2. Authentication (if applicable)
3. Base URL and versioning
4. Endpoint documentation with:
   - HTTP method and path
   - Request parameters
   - Request body schema
   - Response schema
   - Example requests and responses
   - Error codes and messages
5. Rate limiting information
6. SDK examples in multiple languages

Style: ${config.docStyle}
Format: Markdown with proper code syntax highlighting
Include realistic example data in requests/responses.`;
}

function buildSetupGuidePrompt(analysis: any, config: DocumentationConfig): string {
  return `Generate a detailed setup and installation guide for this ${analysis.projectType} project.

Project Details:
- Language: ${analysis.mainLanguage}
- Package Manager: ${analysis.packageInfo?.packageManager || 'unknown'}
- Dependencies: ${Object.keys(analysis.dependencies).length} dependencies
- Config Files: ${analysis.configFiles.join(', ')}

Include:
1. Prerequisites and system requirements
2. Step-by-step installation instructions
3. Environment configuration
4. Database setup (if applicable)
5. Development environment setup
6. Production deployment guide
7. Common issues and troubleshooting
8. Verification steps

Style: ${config.docStyle}
Write for: ${config.targetAudience}
Make it beginner-friendly with clear commands and explanations.`;
}

function buildExamplesPrompt(analysis: any, config: DocumentationConfig): string {
  return `Generate practical usage examples for this ${analysis.projectType} project.

Project Context:
- Language: ${analysis.mainLanguage}
- Entry Points: ${analysis.entryPoints.join(', ')}
- API Endpoints: ${analysis.apiEndpoints.length} endpoints

Create examples for:
1. Basic usage scenarios
2. Common use cases
3. Advanced features
4. Integration examples
5. Code snippets with explanations
6. Best practices
7. Real-world scenarios

Style: ${config.docStyle}
Include working code examples with comments.
Show input and expected output.
Cover error handling.`;
}

async function packageDocumentation(
  components: any,
  jobId: string
): Promise<string> {
  const docDir = path.join('/tmp', `docs-output-${jobId}`);
  await fs.mkdir(docDir, { recursive: true });
  
  // Write documentation files
  if (components.readme) {
    await fs.writeFile(path.join(docDir, 'README.md'), components.readme);
  }
  
  if (components.apiDocs) {
    await fs.writeFile(path.join(docDir, 'API.md'), components.apiDocs);
  }
  
  if (components.setupGuide) {
    await fs.writeFile(path.join(docDir, 'SETUP.md'), components.setupGuide);
  }
  
  if (components.examples) {
    await fs.writeFile(path.join(docDir, 'EXAMPLES.md'), components.examples);
  }
  
  // Create docs package
  const zipPath = path.join('/tmp', `documentation-${jobId}.zip`);
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  archive.pipe(output);
  archive.directory(docDir, false);
  await archive.finalize();
  
  // Upload to S3
  const fileBuffer = await fs.readFile(zipPath);
  const s3Key = `documentation/${jobId}/docs-package.zip`;
  const uploadUrl = await uploadToS3(fileBuffer, s3Key);
  
  // Cleanup
  await fs.rm(docDir, { recursive: true, force: true });
  await fs.unlink(zipPath);
  
  return uploadUrl;
}

// Helper functions
async function getAllFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  
  async function scan(currentDir: string) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory() && !shouldIgnoreDir(entry.name)) {
        await scan(fullPath);
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
    'node_modules', '.git', 'dist', 'build', 'coverage', 
    '.next', '.nuxt', 'vendor', '__pycache__'
  ];
  return ignoreDirs.includes(dirName) || dirName.startsWith('.');
}

async function detectProjectType(files: string[]): Promise<string> {
  if (files.some(f => f.endsWith('package.json'))) return 'node';
  if (files.some(f => f.endsWith('requirements.txt') || f.endsWith('setup.py'))) return 'python';
  if (files.some(f => f.endsWith('pom.xml') || f.endsWith('build.gradle'))) return 'java';
  if (files.some(f => f.endsWith('Cargo.toml'))) return 'rust';
  if (files.some(f => f.endsWith('go.mod'))) return 'go';
  return 'unknown';
}

function detectMainLanguage(files: string[]): string {
  const extensions = files.map(f => path.extname(f));
  const counts: Record<string, number> = {};
  
  extensions.forEach(ext => {
    counts[ext] = (counts[ext] || 0) + 1;
  });
  
  const languageMap: Record<string, string> = {
    '.js': 'javascript',
    '.ts': 'typescript',
    '.py': 'python',
    '.java': 'java',
    '.rs': 'rust',
    '.go': 'go',
  };
  
  const mostCommon = Object.entries(counts)
    .sort(([,a], [,b]) => b - a)[0];
  
  return languageMap[mostCommon?.[0]] || 'unknown';
}

async function parsePackageInfo(sourceDir: string, projectType: string): Promise<any> {
  try {
    switch (projectType) {
      case 'node':
        const packageJson = await fs.readFile(path.join(sourceDir, 'package.json'), 'utf-8');
        return JSON.parse(packageJson);
      case 'python':
        // Parse setup.py or requirements.txt
        // Simplified for MVP
        return { name: 'Python Project', dependencies: {} };
      default:
        return null;
    }
  } catch (error) {
    return null;
  }
}

function findEntryPoints(files: string[], projectType: string): string[] {
  const entryPoints: string[] = [];
  
  // Common entry point patterns
  const patterns = [
    'index.js', 'index.ts', 'main.js', 'main.ts', 'app.js', 'app.ts',
    'server.js', 'server.ts', 'main.py', '__main__.py', 'app.py'
  ];
  
  patterns.forEach(pattern => {
    const found = files.find(f => f.endsWith(pattern));
    if (found) entryPoints.push(path.basename(found));
  });
  
  return entryPoints;
}

async function extractApiEndpoints(files: string[]): Promise<any[]> {
  // Simplified API endpoint extraction
  // In a full implementation, this would parse route files
  const endpoints: any[] = [];
  
  // Look for common API patterns in file names
  const apiFiles = files.filter(f => 
    f.includes('route') || f.includes('api') || f.includes('endpoint')
  );
  
  // Mock some endpoints for demonstration
  if (apiFiles.length > 0) {
    endpoints.push(
      { method: 'GET', path: '/api/health', description: 'Health check endpoint' },
      { method: 'POST', path: '/api/data', description: 'Create data endpoint' }
    );
  }
  
  return endpoints;
}

function isTestFile(filePath: string): boolean {
  const filename = path.basename(filePath);
  return filename.includes('.test.') || filename.includes('.spec.') || 
         filePath.includes('/test/') || filePath.includes('/__tests__/');
}

function isConfigFile(filePath: string): boolean {
  const filename = path.basename(filePath);
  return ['package.json', 'tsconfig.json', '.env', 'docker-compose.yml', 
          'Dockerfile', 'webpack.config.js'].includes(filename) ||
         filename.endsWith('.config.js') || filename.endsWith('.config.ts');
}

function calculateDocQualityScore(data: any): number {
  let score = 0;
  
  // Base score for having README
  if (data.readme && data.readme.length > 500) score += 30;
  
  // API documentation bonus
  if (data.apiDocs && data.apiDocs.length > 300) score += 25;
  
  // Setup guide bonus
  if (data.setupGuide && data.setupGuide.length > 200) score += 20;
  
  // Examples bonus
  if (data.examples && data.examples.length > 300) score += 15;
  
  // Completeness bonus
  if (data.analysis.apiEndpoints.length > 0 && data.apiDocs) score += 10;
  
  return Math.min(100, score);
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