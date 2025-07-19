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
exports.generateTests = generateTests;
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const logger_1 = require("../utils/logger");
const router_1 = require("../llm/router");
const database_1 = require("../utils/database");
const storage_1 = require("../utils/storage");
const errors_1 = require("../utils/errors");
const archiver_1 = __importDefault(require("archiver"));
async function generateTests(jobId, config, progressCallback) {
    const updateProgress = (progress) => {
        progressCallback?.(progress);
    };
    updateProgress(5);
    try {
        // Get job details
        const job = await database_1.prisma.job.findUnique({
            where: { id: jobId },
            include: { analysisResult: true },
        });
        if (!job) {
            throw new errors_1.ProcessingError('Job not found');
        }
        logger_1.logger.info('Starting test generation', { jobId, config });
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
        await database_1.prisma.testGenerationResult.create({
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
    }
    catch (error) {
        logger_1.logger.error('Test generation failed', { jobId, error });
        throw error;
    }
}
async function downloadAndExtract(fileUrl, jobId) {
    const tempDir = path_1.default.join('/tmp', `test-gen-${jobId}`);
    const extractDir = path_1.default.join(tempDir, 'source');
    await promises_1.default.mkdir(extractDir, { recursive: true });
    const fileBuffer = await (0, storage_1.downloadFromS3)(fileUrl);
    const zipPath = path_1.default.join(tempDir, 'source.zip');
    await promises_1.default.writeFile(zipPath, fileBuffer);
    const unzipper = await Promise.resolve().then(() => __importStar(require('unzipper')));
    await promises_1.default.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: extractDir }))
        .promise();
    return extractDir;
}
async function analyzeCodebaseForTests(sourceDir) {
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
async function generateTestComponents(sourceDir, analysis, config) {
    let totalCost = 0;
    // Generate unit tests
    const unitTestsResult = await router_1.llmRouter.route({
        type: 'generate',
        input: {
            prompt: buildUnitTestsPrompt(analysis, config),
        },
        options: { preferLocal: true, maxCost: 0.30 }
    });
    const unitTests = parseGeneratedTests(unitTestsResult.data, 'unit');
    totalCost += unitTestsResult.cost;
    // Generate integration tests if requested
    let integrationTests = [];
    if (config.testTypes.includes('integration')) {
        const integrationResult = await router_1.llmRouter.route({
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
    let e2eTests = [];
    if (config.testTypes.includes('e2e')) {
        const e2eResult = await router_1.llmRouter.route({
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
function buildUnitTestsPrompt(analysis, config) {
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
function buildIntegrationTestsPrompt(analysis, config) {
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
function buildE2ETestsPrompt(analysis, config) {
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
async function packageTestSuite(components, jobId) {
    const testDir = path_1.default.join('/tmp', `test-output-${jobId}`);
    await promises_1.default.mkdir(testDir, { recursive: true });
    // Create test directory structure
    await promises_1.default.mkdir(path_1.default.join(testDir, 'tests', 'unit'), { recursive: true });
    await promises_1.default.mkdir(path_1.default.join(testDir, 'tests', 'integration'), { recursive: true });
    await promises_1.default.mkdir(path_1.default.join(testDir, 'tests', 'e2e'), { recursive: true });
    // Write unit tests
    for (const test of components.unitTests) {
        await promises_1.default.writeFile(path_1.default.join(testDir, 'tests', 'unit', test.file), test.code);
    }
    // Write integration tests
    for (const test of components.integrationTests) {
        await promises_1.default.writeFile(path_1.default.join(testDir, 'tests', 'integration', test.file), test.code);
    }
    // Write E2E tests if present
    if (components.e2eTests) {
        for (const test of components.e2eTests) {
            await promises_1.default.writeFile(path_1.default.join(testDir, 'tests', 'e2e', test.file), test.code);
        }
    }
    // Generate test configuration
    const testConfig = generateTestConfig(components);
    await promises_1.default.writeFile(path_1.default.join(testDir, `${components.framework}.config.js`), testConfig);
    // Generate package.json with test dependencies
    const packageJson = generateTestPackageJson(components);
    await promises_1.default.writeFile(path_1.default.join(testDir, 'package.json'), JSON.stringify(packageJson, null, 2));
    // Generate README
    const readme = generateTestReadme(components);
    await promises_1.default.writeFile(path_1.default.join(testDir, 'README.md'), readme);
    // Package everything
    const zipPath = path_1.default.join('/tmp', `tests-${jobId}.zip`);
    const output = promises_1.default.createWriteStream(zipPath);
    const archive = (0, archiver_1.default)('zip', { zlib: { level: 9 } });
    archive.pipe(output);
    archive.directory(testDir, false);
    await archive.finalize();
    // Upload to S3
    const fileBuffer = await promises_1.default.readFile(zipPath);
    const s3Key = `test-generation/${jobId}/test-suite.zip`;
    const uploadUrl = await (0, storage_1.uploadToS3)(fileBuffer, s3Key);
    // Cleanup
    await promises_1.default.rm(testDir, { recursive: true, force: true });
    await promises_1.default.unlink(zipPath);
    return uploadUrl;
}
// Helper functions
async function getAllFiles(dir) {
    const files = [];
    async function scan(currentDir) {
        const entries = await promises_1.default.readdir(currentDir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path_1.default.join(currentDir, entry.name);
            if (entry.isDirectory() && !shouldIgnoreDir(entry.name)) {
                await scan(fullPath);
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
    const ignoreDirs = ['node_modules', '.git', 'dist', 'build', 'coverage'];
    return ignoreDirs.includes(dirName) || dirName.startsWith('.');
}
function detectProjectType(files) {
    if (files.some(f => f.endsWith('package.json')))
        return 'node';
    if (files.some(f => f.endsWith('requirements.txt')))
        return 'python';
    return 'unknown';
}
function detectMainLanguage(files) {
    const extensions = files.map(f => path_1.default.extname(f));
    const counts = {};
    extensions.forEach(ext => {
        counts[ext] = (counts[ext] || 0) + 1;
    });
    const languageMap = {
        '.js': 'javascript',
        '.ts': 'typescript',
        '.py': 'python',
        '.java': 'java',
    };
    const mostCommon = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)[0];
    return languageMap[mostCommon?.[0]] || 'unknown';
}
async function extractTestableUnits(files) {
    // Simplified extraction - in production would parse AST
    const codeFiles = files.filter(f => f.endsWith('.js') || f.endsWith('.ts') || f.endsWith('.jsx') || f.endsWith('.tsx'));
    return codeFiles.map(file => ({
        file: path_1.default.basename(file),
        type: 'function',
        name: path_1.default.basename(file, path_1.default.extname(file)),
    }));
}
function isTestFile(filePath) {
    const filename = path_1.default.basename(filePath);
    return filename.includes('.test.') || filename.includes('.spec.') ||
        filePath.includes('/test/') || filePath.includes('/__tests__/');
}
async function detectTestingFramework(sourceDir, projectType) {
    try {
        if (projectType === 'node') {
            const packageJson = await promises_1.default.readFile(path_1.default.join(sourceDir, 'package.json'), 'utf-8');
            const pkg = JSON.parse(packageJson);
            if (pkg.dependencies?.jest || pkg.devDependencies?.jest)
                return 'jest';
            if (pkg.dependencies?.mocha || pkg.devDependencies?.mocha)
                return 'mocha';
            if (pkg.dependencies?.vitest || pkg.devDependencies?.vitest)
                return 'vitest';
        }
    }
    catch (error) {
        // Ignore errors
    }
    return 'jest'; // Default
}
function parseGeneratedTests(data, type) {
    try {
        const jsonMatch = data.match(/\[[^\]]*\]/s);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    }
    catch (error) {
        logger_1.logger.error('Failed to parse generated tests', { error, type });
        return [];
    }
}
function generateTestConfig(components) {
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
function generateTestPackageJson(components) {
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
function getFrameworkVersion(framework) {
    const versions = {
        jest: '^29.7.0',
        mocha: '^10.2.0',
        vitest: '^1.0.0',
        playwright: '^1.40.0',
        cypress: '^13.6.0'
    };
    return versions[framework] || '^29.7.0';
}
function generateTestReadme(components) {
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
//# sourceMappingURL=test-generator.service.js.map