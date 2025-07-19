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
exports.generateAPI = generateAPI;
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const logger_1 = require("../utils/logger");
const router_1 = require("../llm/router");
const database_1 = require("../utils/database");
const storage_1 = require("../utils/storage");
const errors_1 = require("../utils/errors");
const archiver_1 = __importDefault(require("archiver"));
const yaml = __importStar(require("yaml"));
async function generateAPI(jobId, config, progressCallback) {
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
        logger_1.logger.info('Starting API generation', { jobId, config });
        // Download source code
        updateProgress(10);
        const sourceDir = await downloadAndExtract(job.inputFileUrl, jobId);
        updateProgress(20);
        // Analyze codebase for API patterns
        const apiAnalysis = await analyzeCodebaseForAPI(sourceDir, config);
        updateProgress(40);
        // Generate API components
        const apiComponents = await generateAPIComponents(apiAnalysis, config);
        updateProgress(80);
        // Package API code
        const outputUrl = await packageAPI(apiComponents, jobId, config);
        updateProgress(95);
        // Store results
        await database_1.prisma.apiGenerationResult.create({
            data: {
                jobId,
                openApiSpec: apiComponents.openApiSpec,
                endpoints: apiComponents.endpoints,
                models: apiComponents.models,
                middlewareCode: apiComponents.middleware,
                apiType: config.apiType,
                authentication: config.authentication,
                endpointCount: apiComponents.endpoints.length,
                modelCount: apiComponents.models.length,
                processingCostUsd: apiComponents.totalCost,
            },
        });
        // Cleanup
        await cleanup(sourceDir);
        updateProgress(100);
        return {
            outputFileUrl: outputUrl,
            endpointCount: apiComponents.endpoints.length,
            modelCount: apiComponents.models.length,
            openApiSpec: apiComponents.openApiSpec,
            processingCost: apiComponents.totalCost,
        };
    }
    catch (error) {
        logger_1.logger.error('API generation failed', { jobId, error });
        throw error;
    }
}
async function downloadAndExtract(fileUrl, jobId) {
    const tempDir = path_1.default.join('/tmp', `api-gen-${jobId}`);
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
async function analyzeCodebaseForAPI(sourceDir, config) {
    const files = await getAllFiles(sourceDir);
    // Detect database models/schemas
    const models = await extractModels(files);
    // Find existing API endpoints
    const existingEndpoints = await extractExistingEndpoints(files);
    // Analyze database schema
    const databaseSchema = await analyzeDatabaseSchema(files);
    // Detect project type and framework
    const projectType = detectProjectType(files);
    const framework = config.framework === 'auto'
        ? detectFramework(files)
        : config.framework;
    // Suggest new endpoints based on models
    const suggestedEndpoints = generateEndpointSuggestions(models, existingEndpoints);
    return {
        models,
        existingEndpoints,
        databaseSchema,
        projectType,
        framework,
        suggestedEndpoints,
    };
}
async function generateAPIComponents(analysis, config) {
    let totalCost = 0;
    const generatedFiles = [];
    // Generate REST endpoints
    const endpointsResult = await router_1.llmRouter.route({
        type: 'generate',
        input: {
            prompt: buildEndpointsPrompt(analysis, config),
        },
        options: { preferLocal: false, maxCost: 0.50 } // Use Claude for complex API generation
    });
    const endpoints = parseGeneratedEndpoints(endpointsResult.data);
    totalCost += endpointsResult.cost;
    // Generate data models
    const modelsResult = await router_1.llmRouter.route({
        type: 'generate',
        input: {
            prompt: buildModelsPrompt(analysis, config),
        },
        options: { preferLocal: true, maxCost: 0.25 }
    });
    const models = parseGeneratedModels(modelsResult.data);
    totalCost += modelsResult.cost;
    // Generate middleware
    let middleware = '';
    if (config.authentication !== 'none' || config.includeValidation) {
        const middlewareResult = await router_1.llmRouter.route({
            type: 'generate',
            input: {
                prompt: buildMiddlewarePrompt(analysis, config),
            },
            options: { preferLocal: true, maxCost: 0.20 }
        });
        middleware = middlewareResult.data;
        totalCost += middlewareResult.cost;
    }
    // Generate OpenAPI specification
    let openApiSpec;
    if (config.includeOpenApiSpec) {
        const openApiResult = await router_1.llmRouter.route({
            type: 'generate',
            input: {
                prompt: buildOpenApiPrompt(endpoints, models, config),
            },
            options: { preferLocal: true, maxCost: 0.15 }
        });
        openApiSpec = parseOpenApiSpec(openApiResult.data);
        totalCost += openApiResult.cost;
    }
    return {
        endpoints,
        models,
        middleware,
        openApiSpec,
        totalCost,
        generatedFiles,
    };
}
function buildEndpointsPrompt(analysis, config) {
    return `Generate ${config.apiType.toUpperCase()} API endpoints for this project using ${config.framework}.

Existing Models:
${analysis.models.map((m) => `- ${m.name}: ${m.fields?.map((f) => f.name).join(', ')}`).join('\n')}

Suggested Endpoints:
${analysis.suggestedEndpoints.map((e) => `- ${e.method} ${e.path}: ${e.description}`).join('\n')}

Requirements:
- Framework: ${config.framework}
- Authentication: ${config.authentication}
- Include validation: ${config.includeValidation}
- Include pagination: ${config.includePagination}
- Include error handling: ${config.includeErrorHandling}

Generate complete, production-ready endpoints with:
1. Route definitions
2. Request/response schemas
3. Input validation
4. Error handling
5. Business logic
6. Database operations

Use TypeScript and follow REST best practices.
Include proper HTTP status codes and response formats.

Return as valid JSON array of endpoint objects:
[
  {
    "method": "GET",
    "path": "/api/users",
    "description": "Get all users",
    "code": "// Complete endpoint code here",
    "requestSchema": {},
    "responseSchema": {}
  }
]`;
}
function buildModelsPrompt(analysis, config) {
    return `Generate data models and schemas for this ${config.framework} API.

Detected Models:
${analysis.models.map((m) => `- ${m.name}: ${JSON.stringify(m.fields || {})}`).join('\n')}

Database: ${config.database}

Generate:
1. TypeScript interfaces/types
2. Database models (Prisma/Mongoose/Sequelize)
3. Validation schemas (Joi/Zod)
4. DTO (Data Transfer Object) classes

Include:
- Primary keys and relationships
- Validation rules
- Default values
- Indexes for performance
- Timestamps (createdAt, updatedAt)

Return as JSON array of model objects:
[
  {
    "name": "User",
    "interface": "// TypeScript interface",
    "model": "// Database model",
    "validation": "// Validation schema",
    "relationships": []
  }
]`;
}
function buildMiddlewarePrompt(analysis, config) {
    return `Generate middleware for this ${config.framework} API.

Authentication: ${config.authentication}
Include Validation: ${config.includeValidation}
Include Error Handling: ${config.includeErrorHandling}

Generate middleware for:
1. Authentication (${config.authentication})
2. Request validation
3. Error handling
4. Rate limiting
5. CORS
6. Logging
7. Request/response transformation

Framework: ${config.framework}

Return complete middleware code with:
- Proper TypeScript types
- Error handling
- Configuration options
- Documentation comments

Make it production-ready and secure.`;
}
function buildOpenApiPrompt(endpoints, models, config) {
    return `Generate an OpenAPI 3.0 specification for this API.

Endpoints:
${endpoints.map(e => `- ${e.method} ${e.path}: ${e.description}`).join('\n')}

Models:
${models.map(m => `- ${m.name}`).join('\n')}

Authentication: ${config.authentication}

Generate complete OpenAPI spec with:
1. API info and version
2. Server configuration
3. Authentication schemes
4. Path definitions
5. Component schemas
6. Response schemas
7. Error responses

Return valid OpenAPI 3.0 JSON specification.`;
}
async function packageAPI(components, jobId, config) {
    const apiDir = path_1.default.join('/tmp', `api-output-${jobId}`);
    await promises_1.default.mkdir(apiDir, { recursive: true });
    // Create directory structure
    await promises_1.default.mkdir(path_1.default.join(apiDir, 'src'), { recursive: true });
    await promises_1.default.mkdir(path_1.default.join(apiDir, 'src', 'routes'), { recursive: true });
    await promises_1.default.mkdir(path_1.default.join(apiDir, 'src', 'models'), { recursive: true });
    await promises_1.default.mkdir(path_1.default.join(apiDir, 'src', 'middleware'), { recursive: true });
    await promises_1.default.mkdir(path_1.default.join(apiDir, 'docs'), { recursive: true });
    // Write endpoint files
    for (const endpoint of components.endpoints) {
        const filename = `${endpoint.path.replace(/[^a-zA-Z0-9]/g, '_')}.ts`;
        await promises_1.default.writeFile(path_1.default.join(apiDir, 'src', 'routes', filename), endpoint.code);
    }
    // Write model files
    for (const model of components.models) {
        await promises_1.default.writeFile(path_1.default.join(apiDir, 'src', 'models', `${model.name.toLowerCase()}.ts`), model.interface + '\n\n' + model.model);
    }
    // Write middleware
    if (components.middleware) {
        await promises_1.default.writeFile(path_1.default.join(apiDir, 'src', 'middleware', 'index.ts'), components.middleware);
    }
    // Write OpenAPI spec
    if (components.openApiSpec) {
        await promises_1.default.writeFile(path_1.default.join(apiDir, 'docs', 'openapi.json'), JSON.stringify(components.openApiSpec, null, 2));
        // Also create YAML version
        await promises_1.default.writeFile(path_1.default.join(apiDir, 'docs', 'openapi.yaml'), yaml.stringify(components.openApiSpec));
    }
    // Create package.json
    const packageJson = {
        name: `generated-api-${jobId}`,
        version: '1.0.0',
        description: 'Generated API from FinishThisIdea',
        main: 'dist/index.js',
        scripts: {
            start: 'node dist/index.js',
            dev: 'tsx watch src/index.ts',
            build: 'tsc',
            test: 'jest'
        },
        dependencies: getFrameworkDependencies(config.framework),
        devDependencies: {
            '@types/node': '^20.0.0',
            'typescript': '^5.0.0',
            'tsx': '^4.0.0'
        }
    };
    await promises_1.default.writeFile(path_1.default.join(apiDir, 'package.json'), JSON.stringify(packageJson, null, 2));
    // Create main server file
    const serverCode = generateServerCode(config);
    await promises_1.default.writeFile(path_1.default.join(apiDir, 'src', 'index.ts'), serverCode);
    // Create README
    const readme = generateAPIReadme(components, config);
    await promises_1.default.writeFile(path_1.default.join(apiDir, 'README.md'), readme);
    // Package everything
    const zipPath = path_1.default.join('/tmp', `api-${jobId}.zip`);
    const output = promises_1.default.createWriteStream(zipPath);
    const archive = (0, archiver_1.default)('zip', { zlib: { level: 9 } });
    archive.pipe(output);
    archive.directory(apiDir, false);
    await archive.finalize();
    // Upload to S3
    const fileBuffer = await promises_1.default.readFile(zipPath);
    const s3Key = `api-generation/${jobId}/api-package.zip`;
    const uploadUrl = await (0, storage_1.uploadToS3)(fileBuffer, s3Key);
    // Cleanup
    await promises_1.default.rm(apiDir, { recursive: true, force: true });
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
async function extractModels(files) {
    const models = [];
    // Look for model files
    const modelFiles = files.filter(f => f.includes('model') || f.includes('schema') || f.includes('entity'));
    // Simple model extraction (in real implementation, parse actual files)
    if (modelFiles.length > 0) {
        models.push({
            name: 'User',
            fields: [
                { name: 'id', type: 'string', primary: true },
                { name: 'email', type: 'string', required: true },
                { name: 'name', type: 'string', required: true },
                { name: 'createdAt', type: 'Date', default: 'now' }
            ]
        });
    }
    return models;
}
async function extractExistingEndpoints(files) {
    // Simplified endpoint extraction
    const endpoints = [];
    const routeFiles = files.filter(f => f.includes('route') || f.includes('controller') || f.includes('handler'));
    if (routeFiles.length > 0) {
        endpoints.push({ method: 'GET', path: '/health', description: 'Health check' });
    }
    return endpoints;
}
async function analyzeDatabaseSchema(files) {
    // Look for database schema files
    const schemaFiles = files.filter(f => f.includes('schema') || f.includes('migration') || f.endsWith('.sql'));
    return { tables: [], migrations: schemaFiles.length };
}
function detectProjectType(files) {
    if (files.some(f => f.endsWith('package.json')))
        return 'node';
    if (files.some(f => f.endsWith('requirements.txt')))
        return 'python';
    return 'unknown';
}
function detectFramework(files) {
    // Check package.json dependencies
    const packageFiles = files.filter(f => f.endsWith('package.json'));
    // For simplicity, default to express
    return 'express';
}
function generateEndpointSuggestions(models, existing) {
    const suggestions = [];
    models.forEach(model => {
        const basePath = `/api/${model.name.toLowerCase()}s`;
        suggestions.push({ method: 'GET', path: basePath, description: `Get all ${model.name}s` }, { method: 'POST', path: basePath, description: `Create ${model.name}` }, { method: 'GET', path: `${basePath}/:id`, description: `Get ${model.name} by ID` }, { method: 'PUT', path: `${basePath}/:id`, description: `Update ${model.name}` }, { method: 'DELETE', path: `${basePath}/:id`, description: `Delete ${model.name}` });
    });
    return suggestions;
}
function parseGeneratedEndpoints(data) {
    try {
        // Extract JSON from the generated response
        const jsonMatch = data.match(/\[[\s\S]*\]/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    }
    catch (error) {
        logger_1.logger.error('Failed to parse generated endpoints', { error });
        return [];
    }
}
function parseGeneratedModels(data) {
    try {
        const jsonMatch = data.match(/\[[\s\S]*\]/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    }
    catch (error) {
        logger_1.logger.error('Failed to parse generated models', { error });
        return [];
    }
}
function parseOpenApiSpec(data) {
    try {
        const jsonMatch = data.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    }
    catch (error) {
        logger_1.logger.error('Failed to parse OpenAPI spec', { error });
        return null;
    }
}
function getFrameworkDependencies(framework) {
    const baseDeps = {
        express: '^4.18.2',
        cors: '^2.8.5',
        helmet: '^7.1.0',
        dotenv: '^16.3.1'
    };
    switch (framework) {
        case 'express':
            return { ...baseDeps };
        case 'fastify':
            return { fastify: '^4.24.3', '@fastify/cors': '^8.4.0' };
        case 'nestjs':
            return {
                '@nestjs/core': '^10.0.0',
                '@nestjs/common': '^10.0.0',
                '@nestjs/platform-express': '^10.0.0'
            };
        default:
            return baseDeps;
    }
}
function generateServerCode(config) {
    return `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Import and use generated routes
// TODO: Import your generated route files here

app.listen(PORT, () => {
  console.log(\`🚀 API server running on port \${PORT}\`);
});

export default app;`;
}
function generateAPIReadme(components, config) {
    return `# Generated API

This API was generated by FinishThisIdea's API Generator service.

## Overview

- **Framework**: ${config.framework}
- **API Type**: ${config.apiType}
- **Authentication**: ${config.authentication}
- **Endpoints**: ${components.endpoints.length}
- **Models**: ${components.models.length}

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Set up environment variables:
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your configuration
   \`\`\`

3. Start development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## API Documentation

${components.openApiSpec ? '- OpenAPI specification: `docs/openapi.json`' : ''}
- Health check: \`GET /health\`

## Endpoints

${components.endpoints.map((e) => `- \`${e.method} ${e.path}\`: ${e.description}`).join('\n')}

## Models

${components.models.map((m) => `- ${m.name}`).join('\n')}

---

Generated by [FinishThisIdea](https://finishthisidea.com)
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
//# sourceMappingURL=api-generator.service.js.map