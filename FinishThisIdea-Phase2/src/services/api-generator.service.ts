import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { llmRouter } from '../llm/router';
import { prisma } from '../utils/database';
import { uploadToS3, downloadFromS3 } from '../utils/storage';
import { ProcessingError } from '../utils/errors';
import archiver from 'archiver';
import * as yaml from 'yaml';

export interface ApiGenerationConfig {
  apiType: 'rest' | 'graphql' | 'both';
  authentication: 'none' | 'jwt' | 'api-key' | 'oauth';
  includeValidation: boolean;
  includePagination: boolean;
  includeErrorHandling: boolean;
  includeOpenApiSpec: boolean;
  includeTests: boolean;
  framework: 'express' | 'fastify' | 'nestjs' | 'auto';
  database: 'postgresql' | 'mysql' | 'mongodb' | 'auto';
  generateSDK: boolean;
}

export interface ApiGenerationResult {
  outputFileUrl: string;
  endpointCount: number;
  modelCount: number;
  openApiSpec?: any;
  processingCost: number;
}

export async function generateAPI(
  jobId: string,
  config: ApiGenerationConfig,
  progressCallback?: (progress: number) => void
): Promise<ApiGenerationResult> {
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

    logger.info('Starting API generation', { jobId, config });

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
    await prisma.apiGenerationResult.create({
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

  } catch (error) {
    logger.error('API generation failed', { jobId, error });
    throw error;
  }
}

async function downloadAndExtract(fileUrl: string, jobId: string): Promise<string> {
  const tempDir = path.join('/tmp', `api-gen-${jobId}`);
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

async function analyzeCodebaseForAPI(
  sourceDir: string, 
  config: ApiGenerationConfig
): Promise<{
  models: any[];
  existingEndpoints: any[];
  databaseSchema: any;
  projectType: string;
  framework: string;
  suggestedEndpoints: any[];
}> {
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

async function generateAPIComponents(
  analysis: any,
  config: ApiGenerationConfig
): Promise<{
  endpoints: any[];
  models: any[];
  middleware: string;
  openApiSpec?: any;
  totalCost: number;
  generatedFiles: any[];
}> {
  let totalCost = 0;
  const generatedFiles: any[] = [];
  
  // Generate REST endpoints
  const endpointsResult = await llmRouter.route({
    type: 'generate',
    input: {
      prompt: buildEndpointsPrompt(analysis, config),
    },
    options: { preferLocal: false, maxCost: 0.50 } // Use Claude for complex API generation
  });
  
  const endpoints = parseGeneratedEndpoints(endpointsResult.data);
  totalCost += endpointsResult.cost;
  
  // Generate data models
  const modelsResult = await llmRouter.route({
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
    const middlewareResult = await llmRouter.route({
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
    const openApiResult = await llmRouter.route({
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

function buildEndpointsPrompt(analysis: any, config: ApiGenerationConfig): string {
  return `Generate ${config.apiType.toUpperCase()} API endpoints for this project using ${config.framework}.

Existing Models:
${analysis.models.map((m: any) => `- ${m.name}: ${m.fields?.map((f: any) => f.name).join(', ')}`).join('\n')}

Suggested Endpoints:
${analysis.suggestedEndpoints.map((e: any) => `- ${e.method} ${e.path}: ${e.description}`).join('\n')}

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

function buildModelsPrompt(analysis: any, config: ApiGenerationConfig): string {
  return `Generate data models and schemas for this ${config.framework} API.

Detected Models:
${analysis.models.map((m: any) => `- ${m.name}: ${JSON.stringify(m.fields || {})}`).join('\n')}

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

function buildMiddlewarePrompt(analysis: any, config: ApiGenerationConfig): string {
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

function buildOpenApiPrompt(endpoints: any[], models: any[], config: ApiGenerationConfig): string {
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

async function packageAPI(
  components: any,
  jobId: string,
  config: ApiGenerationConfig
): Promise<string> {
  const apiDir = path.join('/tmp', `api-output-${jobId}`);
  await fs.mkdir(apiDir, { recursive: true });
  
  // Create directory structure
  await fs.mkdir(path.join(apiDir, 'src'), { recursive: true });
  await fs.mkdir(path.join(apiDir, 'src', 'routes'), { recursive: true });
  await fs.mkdir(path.join(apiDir, 'src', 'models'), { recursive: true });
  await fs.mkdir(path.join(apiDir, 'src', 'middleware'), { recursive: true });
  await fs.mkdir(path.join(apiDir, 'docs'), { recursive: true });
  
  // Write endpoint files
  for (const endpoint of components.endpoints) {
    const filename = `${endpoint.path.replace(/[^a-zA-Z0-9]/g, '_')}.ts`;
    await fs.writeFile(
      path.join(apiDir, 'src', 'routes', filename),
      endpoint.code
    );
  }
  
  // Write model files
  for (const model of components.models) {
    await fs.writeFile(
      path.join(apiDir, 'src', 'models', `${model.name.toLowerCase()}.ts`),
      model.interface + '\n\n' + model.model
    );
  }
  
  // Write middleware
  if (components.middleware) {
    await fs.writeFile(
      path.join(apiDir, 'src', 'middleware', 'index.ts'),
      components.middleware
    );
  }
  
  // Write OpenAPI spec
  if (components.openApiSpec) {
    await fs.writeFile(
      path.join(apiDir, 'docs', 'openapi.json'),
      JSON.stringify(components.openApiSpec, null, 2)
    );
    
    // Also create YAML version
    await fs.writeFile(
      path.join(apiDir, 'docs', 'openapi.yaml'),
      yaml.stringify(components.openApiSpec)
    );
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
  
  await fs.writeFile(
    path.join(apiDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  
  // Create main server file
  const serverCode = generateServerCode(config);
  await fs.writeFile(path.join(apiDir, 'src', 'index.ts'), serverCode);
  
  // Create README
  const readme = generateAPIReadme(components, config);
  await fs.writeFile(path.join(apiDir, 'README.md'), readme);
  
  // Package everything
  const zipPath = path.join('/tmp', `api-${jobId}.zip`);
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  archive.pipe(output);
  archive.directory(apiDir, false);
  await archive.finalize();
  
  // Upload to S3
  const fileBuffer = await fs.readFile(zipPath);
  const s3Key = `api-generation/${jobId}/api-package.zip`;
  const uploadUrl = await uploadToS3(fileBuffer, s3Key);
  
  // Cleanup
  await fs.rm(apiDir, { recursive: true, force: true });
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

async function extractModels(files: string[]): Promise<any[]> {
  const models: any[] = [];
  
  // Look for model files
  const modelFiles = files.filter(f => 
    f.includes('model') || f.includes('schema') || f.includes('entity')
  );
  
  // Simple model extraction (in real implementation, parse actual files)
  if (modelFiles.length > 0) {
    models.push(
      {
        name: 'User',
        fields: [
          { name: 'id', type: 'string', primary: true },
          { name: 'email', type: 'string', required: true },
          { name: 'name', type: 'string', required: true },
          { name: 'createdAt', type: 'Date', default: 'now' }
        ]
      }
    );
  }
  
  return models;
}

async function extractExistingEndpoints(files: string[]): Promise<any[]> {
  // Simplified endpoint extraction
  const endpoints: any[] = [];
  
  const routeFiles = files.filter(f => 
    f.includes('route') || f.includes('controller') || f.includes('handler')
  );
  
  if (routeFiles.length > 0) {
    endpoints.push(
      { method: 'GET', path: '/health', description: 'Health check' }
    );
  }
  
  return endpoints;
}

async function analyzeDatabaseSchema(files: string[]): Promise<any> {
  // Look for database schema files
  const schemaFiles = files.filter(f => 
    f.includes('schema') || f.includes('migration') || f.endsWith('.sql')
  );
  
  return { tables: [], migrations: schemaFiles.length };
}

function detectProjectType(files: string[]): string {
  if (files.some(f => f.endsWith('package.json'))) return 'node';
  if (files.some(f => f.endsWith('requirements.txt'))) return 'python';
  return 'unknown';
}

function detectFramework(files: string[]): string {
  // Check package.json dependencies
  const packageFiles = files.filter(f => f.endsWith('package.json'));
  
  // For simplicity, default to express
  return 'express';
}

function generateEndpointSuggestions(models: any[], existing: any[]): any[] {
  const suggestions: any[] = [];
  
  models.forEach(model => {
    const basePath = `/api/${model.name.toLowerCase()}s`;
    
    suggestions.push(
      { method: 'GET', path: basePath, description: `Get all ${model.name}s` },
      { method: 'POST', path: basePath, description: `Create ${model.name}` },
      { method: 'GET', path: `${basePath}/:id`, description: `Get ${model.name} by ID` },
      { method: 'PUT', path: `${basePath}/:id`, description: `Update ${model.name}` },
      { method: 'DELETE', path: `${basePath}/:id`, description: `Delete ${model.name}` }
    );
  });
  
  return suggestions;
}

function parseGeneratedEndpoints(data: string): any[] {
  try {
    // Extract JSON from the generated response
    const jsonMatch = data.match(/\[[\s\S]*\]/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  } catch (error) {
    logger.error('Failed to parse generated endpoints', { error });
    return [];
  }
}

function parseGeneratedModels(data: string): any[] {
  try {
    const jsonMatch = data.match(/\[[\s\S]*\]/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  } catch (error) {
    logger.error('Failed to parse generated models', { error });
    return [];
  }
}

function parseOpenApiSpec(data: string): any {
  try {
    const jsonMatch = data.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (error) {
    logger.error('Failed to parse OpenAPI spec', { error });
    return null;
  }
}

function getFrameworkDependencies(framework: string): Record<string, string> {
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

function generateServerCode(config: ApiGenerationConfig): string {
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

function generateAPIReadme(components: any, config: ApiGenerationConfig): string {
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

${components.endpoints.map((e: any) => `- \`${e.method} ${e.path}\`: ${e.description}`).join('\n')}

## Models

${components.models.map((m: any) => `- ${m.name}`).join('\n')}

---

Generated by [FinishThisIdea](https://finishthisidea.com)
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