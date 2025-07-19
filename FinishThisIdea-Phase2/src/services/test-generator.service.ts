import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { llmRouter } from '../llm/router';
import { prisma } from '../utils/database';
import { uploadToS3, downloadFromS3 } from '../utils/storage';
import { ProcessingError } from '../utils/errors';
import archiver from 'archiver';

export interface TestGenerationConfig {
  testTypes: ('unit' | 'integration' | 'e2e' | 'performance')[];
  framework: 'jest' | 'mocha' | 'vitest' | 'playwright' | 'cypress' | 'auto';
  coverageTarget: number; // percentage
  includeSnapshots: boolean;
  includeMocks: boolean;
  includePerformance: boolean;
  testDataGeneration: boolean;
  mutationTesting: boolean;
}

export interface TestGenerationResult {
  outputFileUrl: string;
  generatedTests: {
    unit: number;
    integration: number;
    e2e: number;
    performance: number;
  };
  estimatedCoverage: number;
  testFramework: string;
  processingCost: number;
}

export async function generateTests(
  jobId: string,
  config: TestGenerationConfig,
  progressCallback?: (progress: number) => void
): Promise<TestGenerationResult> {
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

    logger.info('Starting test generation', { jobId, config });

    // Download source code
    updateProgress(10);
    const sourceDir = await downloadAndExtract(job.inputFileUrl, jobId);
    
    updateProgress(20);
    
    // Analyze codebase for testable components
    const codeAnalysis = await analyzeCodebaseForTests(sourceDir);
    updateProgress(40);
    
    // Generate test cases
    const testComponents = await generateTestComponents(sourceDir, codeAnalysis, config);
    updateProgress(80);
    
    // Package test suite
    const outputUrl = await packageTestSuite(testComponents, jobId);
    updateProgress(95);
    
    // Store results
    await prisma.testGenerationResult.create({
      data: {
        jobId,
        unitTests: testComponents.unitTests,
        integrationTests: testComponents.integrationTests,
        e2eTests: testComponents.e2eTests || [],
        expectedCoverage: testComponents.estimatedCoverage,
        testFramework: testComponents.framework,
        testCount: testComponents.totalTests,
        assertionCount: testComponents.totalAssertions,
        processingCostUsd: testComponents.totalCost,
      },
    });

    // Cleanup
    await cleanup(sourceDir);
    updateProgress(100);

    return {
      outputFileUrl: outputUrl,
      generatedTests: {
        unit: testComponents.unitTests.length,
        integration: testComponents.integrationTests.length,
        e2e: testComponents.e2eTests?.length || 0,
        performance: testComponents.performanceTests?.length || 0,
      },
      estimatedCoverage: testComponents.estimatedCoverage,
      testFramework: testComponents.framework,
      processingCost: testComponents.totalCost,
    };

  } catch (error) {
    logger.error('Test generation failed', { jobId, error });
    throw error;
  }
}

async function downloadAndExtract(fileUrl: string, jobId: string): Promise<string> {
  const tempDir = path.join('/tmp', `test-gen-${jobId}`);
  const extractDir = path.join(tempDir, 'source');
  
  await fs.mkdir(extractDir, { recursive: true });
  
  const fileBuffer = await downloadFromS3(fileUrl);
  const zipPath = path.join(tempDir, 'source.zip');
  
  await fs.writeFile(zipPath, fileBuffer);
  
  const unzipper = await import('unzipper');
  await fs.createReadStream(zipPath)
    .pipe(unzipper.Extract({ path: extractDir }))
    .promise();
  
  return extractDir;
}

async function analyzeCodebaseForTests(sourceDir: string): Promise<{
  projectType: string;
  mainLanguage: string;
  testableUnits: any[];
  existingTests: string[];
  dependencies: any;
  framework: string;
}> {
  const files = await getAllFiles(sourceDir);
  
  // Detect project type and language
  const projectType = detectProjectType(files);
  const mainLanguage = detectMainLanguage(files);
  
  // Find testable units (functions, classes, components)
  const testableUnits = await extractTestableUnits(files);
  
  // Find existing tests
  const existingTests = files.filter(f => isTestFile(f));
  
  // Detect testing framework
  const framework = await detectTestingFramework(sourceDir, projectType);
  
  return {
    projectType,
    mainLanguage,
    testableUnits,
    existingTests,
    dependencies: {},
    framework,
  };
}

async function generateTestComponents(
  sourceDir: string,
  analysis: any,
  config: TestGenerationConfig
): Promise<{
  unitTests: any[];
  integrationTests: any[];
  e2eTests?: any[];
  performanceTests?: any[];
  framework: string;
  estimatedCoverage: number;
  totalTests: number;
  totalAssertions: number;
  totalCost: number;
}> {
  let totalCost = 0;
  
  // Generate unit tests
  const unitTestsResult = await llmRouter.route({
    type: 'generate',
    input: {
      prompt: buildUnitTestsPrompt(analysis, config),
    },
    options: { preferLocal: true, maxCost: 0.30 }
  });
  
  const unitTests = parseGeneratedTests(unitTestsResult.data, 'unit');
  totalCost += unitTestsResult.cost;
  
  // Generate integration tests if requested
  let integrationTests: any[] = [];
  if (config.testTypes.includes('integration')) {
    const integrationResult = await llmRouter.route({
      type: 'generate',
      input: {
        prompt: buildIntegrationTestsPrompt(analysis, config),
      },
      options: { preferLocal: true, maxCost: 0.25 }
    });
    
    integrationTests = parseGeneratedTests(integrationResult.data, 'integration');
    totalCost += integrationResult.cost;
  }
  
  // Generate E2E tests if requested
  let e2eTests: any[] = [];
  if (config.testTypes.includes('e2e')) {
    const e2eResult = await llmRouter.route({
      type: 'generate',
      input: {
        prompt: buildE2ETestsPrompt(analysis, config),
      },
      options: { preferLocal: false, maxCost: 0.40 } // E2E tests need more sophisticated reasoning
    });
    
    e2eTests = parseGeneratedTests(e2eResult.data, 'e2e');
    totalCost += e2eResult.cost;
  }
  
  // Calculate metrics
  const totalTests = unitTests.length + integrationTests.length + e2eTests.length;
  const totalAssertions = totalTests * 3; // Estimate 3 assertions per test
  const estimatedCoverage = Math.min(95, 60 + (totalTests * 2)); // Base 60% + 2% per test
  
  return {
    unitTests,
    integrationTests,
    e2eTests,
    framework: config.framework === 'auto' ? analysis.framework : config.framework,
    estimatedCoverage,
    totalTests,
    totalAssertions,
    totalCost,
  };
}

function buildUnitTestsPrompt(analysis: any, config: TestGenerationConfig): string {
  return `Generate comprehensive unit tests for this ${analysis.projectType} project.

Project Analysis:
- Language: ${analysis.mainLanguage}
- Framework: ${analysis.framework}
- Testable Units: ${analysis.testableUnits.length} functions/classes/components

Test Requirements:
- Framework: ${config.framework}
- Coverage Target: ${config.coverageTarget}%
- Include Mocks: ${config.includeMocks}
- Include Snapshots: ${config.includeSnapshots}

Generate tests that cover:
1. Happy path scenarios
2. Edge cases and boundary conditions
3. Error handling
4. Input validation
5. Mock external dependencies

For each testable unit, create:
- Descriptive test names
- Arrange-Act-Assert structure
- Proper mocking and setup
- Multiple test cases per function

Return as JSON array of test objects:
[
  {
    "file": "src/components/Button.test.ts",
    "testName": "Button component",
    "testCases": [
      {
        "name": "should render with default props",
        "code": "// Test code here",
        "type": "unit",
        "assertions": 3
      }
    ]
  }
]`;
}

function buildIntegrationTestsPrompt(analysis: any, config: TestGenerationConfig): string {
  return `Generate integration tests for this ${analysis.projectType} project.

Focus on testing:
1. Module interactions
2. API endpoints with real dependencies
3. Database operations
4. File system operations
5. External service integrations

Framework: ${config.framework}

Create tests that verify:
- Data flow between components
- API request/response cycles
- Database CRUD operations
- Authentication flows
- Error propagation

Return as JSON array of integration test objects.`;
}

function buildE2ETestsPrompt(analysis: any, config: TestGenerationConfig): string {
  return `Generate end-to-end tests for this ${analysis.projectType} application.

Create user journey tests that cover:
1. Critical user workflows
2. Authentication scenarios
3. Form submissions and validations
4. Navigation flows
5. Error scenarios

Framework: ${config.framework}

Generate realistic test scenarios with:
- User actions (click, type, navigate)
- Assertions on UI state
- Data verification
- Error handling

Return as JSON array of E2E test objects.`;
}

async function packageTestSuite(components: any, jobId: string): Promise<string> {
  const testDir = path.join('/tmp', `test-output-${jobId}`);
  await fs.mkdir(testDir, { recursive: true });
  
  // Create test directory structure
  await fs.mkdir(path.join(testDir, 'tests', 'unit'), { recursive: true });
  await fs.mkdir(path.join(testDir, 'tests', 'integration'), { recursive: true });
  await fs.mkdir(path.join(testDir, 'tests', 'e2e'), { recursive: true });
  
  // Write unit tests
  for (const test of components.unitTests) {
    await fs.writeFile(
      path.join(testDir, 'tests', 'unit', test.file),
      test.code
    );
  }
  
  // Write integration tests
  for (const test of components.integrationTests) {
    await fs.writeFile(
      path.join(testDir, 'tests', 'integration', test.file),
      test.code
    );
  }
  
  // Write E2E tests if present
  if (components.e2eTests) {
    for (const test of components.e2eTests) {
      await fs.writeFile(
        path.join(testDir, 'tests', 'e2e', test.file),
        test.code
      );
    }
  }
  
  // Generate test configuration
  const testConfig = generateTestConfig(components);
  await fs.writeFile(
    path.join(testDir, `${components.framework}.config.js`),
    testConfig
  );
  
  // Generate package.json with test dependencies
  const packageJson = generateTestPackageJson(components);
  await fs.writeFile(
    path.join(testDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  
  // Generate README
  const readme = generateTestReadme(components);
  await fs.writeFile(path.join(testDir, 'README.md'), readme);
  
  // Package everything
  const zipPath = path.join('/tmp', `tests-${jobId}.zip`);
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  archive.pipe(output);
  archive.directory(testDir, false);
  await archive.finalize();
  
  // Upload to S3
  const fileBuffer = await fs.readFile(zipPath);
  const s3Key = `test-generation/${jobId}/test-suite.zip`;
  const uploadUrl = await uploadToS3(fileBuffer, s3Key);
  
  // Cleanup
  await fs.rm(testDir, { recursive: true, force: true });
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
  const ignoreDirs = ['node_modules', '.git', 'dist', 'build', 'coverage'];
  return ignoreDirs.includes(dirName) || dirName.startsWith('.');
}

function detectProjectType(files: string[]): string {
  if (files.some(f => f.endsWith('package.json'))) return 'node';
  if (files.some(f => f.endsWith('requirements.txt'))) return 'python';
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
  };
  
  const mostCommon = Object.entries(counts)
    .sort(([,a], [,b]) => b - a)[0];
  
  return languageMap[mostCommon?.[0]] || 'unknown';
}

async function extractTestableUnits(files: string[]): Promise<any[]> {
  // Simplified extraction - in production would parse AST
  const codeFiles = files.filter(f => 
    f.endsWith('.js') || f.endsWith('.ts') || f.endsWith('.jsx') || f.endsWith('.tsx')
  );
  
  return codeFiles.map(file => ({
    file: path.basename(file),
    type: 'function',
    name: path.basename(file, path.extname(file)),
  }));
}

function isTestFile(filePath: string): boolean {
  const filename = path.basename(filePath);
  return filename.includes('.test.') || filename.includes('.spec.') || 
         filePath.includes('/test/') || filePath.includes('/__tests__/');
}

async function detectTestingFramework(sourceDir: string, projectType: string): Promise<string> {
  try {
    if (projectType === 'node') {
      const packageJson = await fs.readFile(path.join(sourceDir, 'package.json'), 'utf-8');
      const pkg = JSON.parse(packageJson);
      
      if (pkg.dependencies?.jest || pkg.devDependencies?.jest) return 'jest';
      if (pkg.dependencies?.mocha || pkg.devDependencies?.mocha) return 'mocha';
      if (pkg.dependencies?.vitest || pkg.devDependencies?.vitest) return 'vitest';
    }
  } catch (error) {
    // Ignore errors
  }
  
  return 'jest'; // Default
}

function parseGeneratedTests(data: string, type: string): any[] {
  try {
    const jsonMatch = data.match(/\[[^\]]*\]/s);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  } catch (error) {
    logger.error('Failed to parse generated tests', { error, type });
    return [];
  }
}

function generateTestConfig(components: any): string {
  return `module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: ${components.estimatedCoverage - 10},
      functions: ${components.estimatedCoverage},
      lines: ${components.estimatedCoverage},
      statements: ${components.estimatedCoverage}
    }
  },
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.test.ts'
  ]
};`;
}

function generateTestPackageJson(components: any): any {
  return {
    name: 'generated-test-suite',
    version: '1.0.0',
    description: 'Generated test suite by FinishThisIdea',
    scripts: {
      test: components.framework,
      'test:watch': `${components.framework} --watch`,
      'test:coverage': `${components.framework} --coverage`
    },
    devDependencies: {
      [components.framework]: getFrameworkVersion(components.framework),
      '@types/jest': '^29.5.0',
      'typescript': '^5.0.0'
    }
  };
}

function getFrameworkVersion(framework: string): string {
  const versions = {
    jest: '^29.7.0',
    mocha: '^10.2.0',
    vitest: '^1.0.0',
    playwright: '^1.40.0',
    cypress: '^13.6.0'
  };
  return versions[framework as keyof typeof versions] || '^29.7.0';
}

function generateTestReadme(components: any): string {
  return `# Generated Test Suite

This test suite was generated by FinishThisIdea's Test Generator service.

## Overview

- **Framework**: ${components.framework}
- **Total Tests**: ${components.totalTests}
- **Estimated Coverage**: ${components.estimatedCoverage}%
- **Unit Tests**: ${components.unitTests.length}
- **Integration Tests**: ${components.integrationTests.length}
- **E2E Tests**: ${components.e2eTests?.length || 0}

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Run tests:
   \`\`\`bash
   npm test
   \`\`\`

3. Run with coverage:
   \`\`\`bash
   npm run test:coverage
   \`\`\`

## Test Structure

- \`tests/unit/\` - Unit tests for individual functions/components
- \`tests/integration/\` - Integration tests for module interactions
- \`tests/e2e/\` - End-to-end tests for user workflows

## Generated by FinishThisIdea

This test suite was automatically generated to provide comprehensive coverage of your codebase.
`;
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