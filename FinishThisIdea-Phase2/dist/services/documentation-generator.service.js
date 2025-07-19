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
exports.generateDocumentation = generateDocumentation;
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const logger_1 = require("../utils/logger");
const router_1 = require("../llm/router");
const database_1 = require("../utils/database");
const storage_1 = require("../utils/storage");
const errors_1 = require("../utils/errors");
const archiver_1 = __importDefault(require("archiver"));
async function generateDocumentation(jobId, config, progressCallback) {
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
        logger_1.logger.info('Starting documentation generation', { jobId, config });
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
        await database_1.prisma.documentationResult.create({
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
    }
    catch (error) {
        logger_1.logger.error('Documentation generation failed', { jobId, error });
        throw error;
    }
}
async function downloadAndExtract(fileUrl, jobId) {
    const tempDir = path_1.default.join('/tmp', `docs-${jobId}`);
    const extractDir = path_1.default.join(tempDir, 'source');
    await promises_1.default.mkdir(extractDir, { recursive: true });
    // Download and extract source code
    const fileBuffer = await (0, storage_1.downloadFromS3)(fileUrl);
    const zipPath = path_1.default.join(tempDir, 'source.zip');
    await promises_1.default.writeFile(zipPath, fileBuffer);
    const unzipper = await Promise.resolve().then(() => __importStar(require('unzipper')));
    await promises_1.default.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: extractDir }))
        .promise();
    return extractDir;
}
async function analyzeCodebaseForDocs(sourceDir) {
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
async function generateDocumentationComponents(sourceDir, analysis, config) {
    let totalCost = 0;
    const files = [];
    // Generate README.md
    let readme = '';
    if (config.includeReadme) {
        const readmeResult = await router_1.llmRouter.route({
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
        const apiDocsResult = await router_1.llmRouter.route({
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
        const setupResult = await router_1.llmRouter.route({
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
        const examplesResult = await router_1.llmRouter.route({
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
function buildReadmePrompt(analysis, config) {
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
function buildApiDocsPrompt(analysis, config) {
    return `Generate comprehensive API documentation for this ${analysis.projectType} project.

API Endpoints Found:
${analysis.apiEndpoints.map((ep) => `- ${ep.method} ${ep.path}: ${ep.description || 'No description'}`).join('\n')}

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
function buildSetupGuidePrompt(analysis, config) {
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
function buildExamplesPrompt(analysis, config) {
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
async function packageDocumentation(components, jobId) {
    const docDir = path_1.default.join('/tmp', `docs-output-${jobId}`);
    await promises_1.default.mkdir(docDir, { recursive: true });
    // Write documentation files
    if (components.readme) {
        await promises_1.default.writeFile(path_1.default.join(docDir, 'README.md'), components.readme);
    }
    if (components.apiDocs) {
        await promises_1.default.writeFile(path_1.default.join(docDir, 'API.md'), components.apiDocs);
    }
    if (components.setupGuide) {
        await promises_1.default.writeFile(path_1.default.join(docDir, 'SETUP.md'), components.setupGuide);
    }
    if (components.examples) {
        await promises_1.default.writeFile(path_1.default.join(docDir, 'EXAMPLES.md'), components.examples);
    }
    // Create docs package
    const zipPath = path_1.default.join('/tmp', `documentation-${jobId}.zip`);
    const output = promises_1.default.createWriteStream(zipPath);
    const archive = (0, archiver_1.default)('zip', { zlib: { level: 9 } });
    archive.pipe(output);
    archive.directory(docDir, false);
    await archive.finalize();
    // Upload to S3
    const fileBuffer = await promises_1.default.readFile(zipPath);
    const s3Key = `documentation/${jobId}/docs-package.zip`;
    const uploadUrl = await (0, storage_1.uploadToS3)(fileBuffer, s3Key);
    // Cleanup
    await promises_1.default.rm(docDir, { recursive: true, force: true });
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
    const ignoreDirs = [
        'node_modules', '.git', 'dist', 'build', 'coverage',
        '.next', '.nuxt', 'vendor', '__pycache__'
    ];
    return ignoreDirs.includes(dirName) || dirName.startsWith('.');
}
async function detectProjectType(files) {
    if (files.some(f => f.endsWith('package.json')))
        return 'node';
    if (files.some(f => f.endsWith('requirements.txt') || f.endsWith('setup.py')))
        return 'python';
    if (files.some(f => f.endsWith('pom.xml') || f.endsWith('build.gradle')))
        return 'java';
    if (files.some(f => f.endsWith('Cargo.toml')))
        return 'rust';
    if (files.some(f => f.endsWith('go.mod')))
        return 'go';
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
        '.rs': 'rust',
        '.go': 'go',
    };
    const mostCommon = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)[0];
    return languageMap[mostCommon?.[0]] || 'unknown';
}
async function parsePackageInfo(sourceDir, projectType) {
    try {
        switch (projectType) {
            case 'node':
                const packageJson = await promises_1.default.readFile(path_1.default.join(sourceDir, 'package.json'), 'utf-8');
                return JSON.parse(packageJson);
            case 'python':
                // Parse setup.py or requirements.txt
                // Simplified for MVP
                return { name: 'Python Project', dependencies: {} };
            default:
                return null;
        }
    }
    catch (error) {
        return null;
    }
}
function findEntryPoints(files, projectType) {
    const entryPoints = [];
    // Common entry point patterns
    const patterns = [
        'index.js', 'index.ts', 'main.js', 'main.ts', 'app.js', 'app.ts',
        'server.js', 'server.ts', 'main.py', '__main__.py', 'app.py'
    ];
    patterns.forEach(pattern => {
        const found = files.find(f => f.endsWith(pattern));
        if (found)
            entryPoints.push(path_1.default.basename(found));
    });
    return entryPoints;
}
async function extractApiEndpoints(files) {
    // Simplified API endpoint extraction
    // In a full implementation, this would parse route files
    const endpoints = [];
    // Look for common API patterns in file names
    const apiFiles = files.filter(f => f.includes('route') || f.includes('api') || f.includes('endpoint'));
    // Mock some endpoints for demonstration
    if (apiFiles.length > 0) {
        endpoints.push({ method: 'GET', path: '/api/health', description: 'Health check endpoint' }, { method: 'POST', path: '/api/data', description: 'Create data endpoint' });
    }
    return endpoints;
}
function isTestFile(filePath) {
    const filename = path_1.default.basename(filePath);
    return filename.includes('.test.') || filename.includes('.spec.') ||
        filePath.includes('/test/') || filePath.includes('/__tests__/');
}
function isConfigFile(filePath) {
    const filename = path_1.default.basename(filePath);
    return ['package.json', 'tsconfig.json', '.env', 'docker-compose.yml',
        'Dockerfile', 'webpack.config.js'].includes(filename) ||
        filename.endsWith('.config.js') || filename.endsWith('.config.ts');
}
function calculateDocQualityScore(data) {
    let score = 0;
    // Base score for having README
    if (data.readme && data.readme.length > 500)
        score += 30;
    // API documentation bonus
    if (data.apiDocs && data.apiDocs.length > 300)
        score += 25;
    // Setup guide bonus
    if (data.setupGuide && data.setupGuide.length > 200)
        score += 20;
    // Examples bonus
    if (data.examples && data.examples.length > 300)
        score += 15;
    // Completeness bonus
    if (data.analysis.apiEndpoints.length > 0 && data.apiDocs)
        score += 10;
    return Math.min(100, score);
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
//# sourceMappingURL=documentation-generator.service.js.map