import path from 'path';
import fs from 'fs/promises';
import Handlebars from 'handlebars';
import * as yaml from 'yaml';
import { logger } from '../utils/logger';
import { ProcessingError } from '../utils/errors';

export interface ServiceTemplate {
  name: string;
  version: string;
  description: string;
  author: string;
  category: string;
  service: {
    type: string;
    pricing: {
      model: 'fixed' | 'usage' | 'subscription';
      base: number;
      usage?: {
        metric: string;
        rate: number;
      };
      subscription?: {
        monthly: number;
        annual: number;
      };
    };
    sla: {
      processingTime: number;
      accuracy: number;
      uptime: number;
    };
  };
  infrastructure: any;
  ai: any;
  deployment: any;
  monitoring: any;
  security: any;
  testing: any;
  documentation: any;
}

export interface ServiceGenerationConfig {
  templateName: string;
  serviceName: string;
  description: string;
  author: string;
  category: string;
  pricing: {
    model: 'fixed' | 'usage' | 'subscription';
    basePrice: number;
  };
  features: string[];
  ai: {
    useOllama: boolean;
    useOpenAI: boolean;
    useAnthropic: boolean;
    models: string[];
  };
  deployment: {
    platform: 'railway' | 'vercel' | 'docker';
    autoScaling: boolean;
  };
}

export class TemplateEngine {
  private templateDir: string;
  private outputDir: string;

  constructor(templateDir = 'templates', outputDir = 'generated') {
    this.templateDir = templateDir;
    this.outputDir = outputDir;
    this.registerHelpers();
  }

  async generateService(config: ServiceGenerationConfig): Promise<{
    servicePath: string;
    generatedFiles: string[];
  }> {
    try {
      // Load template
      const template = await this.loadTemplate(config.templateName);
      
      // Process template with config
      const processedTemplate = this.processTemplate(template, config);
      
      // Generate service structure
      const servicePath = await this.generateServiceStructure(processedTemplate, config);
      
      // Generate individual files
      const generatedFiles = await this.generateServiceFiles(servicePath, processedTemplate, config);
      
      logger.info('Service generated successfully', {
        serviceName: config.serviceName,
        template: config.templateName,
        filesGenerated: generatedFiles.length,
      });

      return {
        servicePath,
        generatedFiles,
      };

    } catch (error) {
      logger.error('Service generation failed', { config, error });
      throw new ProcessingError(`Failed to generate service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async loadTemplate(templateName: string): Promise<ServiceTemplate> {
    const templatePath = path.join(this.templateDir, templateName, 'template.yaml');
    
    try {
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      return yaml.parse(templateContent) as ServiceTemplate;
    } catch (error) {
      throw new ProcessingError(`Template '${templateName}' not found or invalid`);
    }
  }

  private processTemplate(template: ServiceTemplate, config: ServiceGenerationConfig): any {
    // Create template context
    const context = {
      name: config.serviceName,
      kebabCase: (str: string) => str.toLowerCase().replace(/\s+/g, '-'),
      pascalCase: (str: string) => str.replace(/(?:^|\s)(\w)/g, (_, c) => c.toUpperCase()).replace(/\s+/g, ''),
      camelCase: (str: string) => str.replace(/(?:^\w|[A-Z]|\b\w)/g, (c, i) => i === 0 ? c.toLowerCase() : c.toUpperCase()).replace(/\s+/g, ''),
      description: config.description,
      author: config.author,
      category: config.category,
      basePrice: config.pricing.basePrice,
      pricingModel: config.pricing.model,
      serviceType: template.service.type,
      processingTime: template.service.sla.processingTime,
      accuracyTarget: template.service.sla.accuracy,
      hasFrontend: true,
      frontendFeatures: config.features.filter(f => f.startsWith('frontend:')),
      backendFeatures: config.features.filter(f => f.startsWith('backend:')),
      defaultPort: 3001,
      includeSeeds: true,
      queueConcurrency: 5,
      jobTimeout: 30 * 60 * 1000, // 30 minutes
      storageProvider: 's3',
      maxFileSize: 50,
      allowedFormats: ['.zip', '.tar.gz', '.tar'],
      ollamaModels: config.ai.models.filter(m => m.includes('ollama') || m.includes('codellama')),
      useOpenAI: config.ai.useOpenAI,
      openaiModels: ['gpt-3.5-turbo', 'gpt-4'],
      openaiMaxCost: 0.50,
      useAnthropic: config.ai.useAnthropic,
      anthropicModels: ['claude-3-sonnet-20240229'],
      anthropicMaxCost: 1.00,
      routingStrategy: 'cost-optimized',
      localFirst: true,
      hybridThreshold: 0.8,
      minConfidence: 0.7,
      validationRequired: true,
      humanReviewThreshold: 0.5,
      deploymentPlatform: config.deployment.platform,
      autoScaling: config.deployment.autoScaling,
      minInstances: 1,
      maxInstances: 10,
      environmentVariables: [
        { key: 'NODE_ENV', value: 'production' },
        { key: 'LOG_LEVEL', value: 'info' },
      ],
      useExternalAPIs: config.ai.useOpenAI || config.ai.useAnthropic,
      monitoringServices: ['prometheus'],
      customMetrics: ['ai-cost', 'processing-time'],
      customAlerts: [
        { metric: 'ai-cost', threshold: 10, window: '1h', severity: 'warning' }
      ],
      authType: 'api-key',
      rateLimitMax: 100,
      corsOrigins: ['http://localhost:3000'],
      coverageTarget: 80,
      coverageThreshold: 70,
      includeE2E: true,
      includePerformance: false,
      docFormats: ['openapi'],
      customDocSections: ['examples', 'troubleshooting'],
    };

    // Process template with Handlebars
    const templateStr = JSON.stringify(template);
    const compiledTemplate = Handlebars.compile(templateStr);
    const processedStr = compiledTemplate(context);
    
    return JSON.parse(processedStr);
  }

  private async generateServiceStructure(template: any, config: ServiceGenerationConfig): Promise<string> {
    const servicePath = path.join(this.outputDir, config.serviceName);
    
    // Create directory structure
    const directories = [
      'src/api/routes',
      'src/services',
      'src/llm',
      'src/jobs',
      'src/utils',
      'src/middleware',
      'docs',
      'templates',
      'tests/unit',
      'tests/integration',
      'tests/e2e',
      'public',
      'prisma',
      'scripts',
    ];

    for (const dir of directories) {
      await fs.mkdir(path.join(servicePath, dir), { recursive: true });
    }

    return servicePath;
  }

  private async generateServiceFiles(
    servicePath: string, 
    template: any, 
    config: ServiceGenerationConfig
  ): Promise<string[]> {
    const generatedFiles: string[] = [];

    // Generate package.json
    const packageJson = this.generatePackageJson(template, config);
    await fs.writeFile(
      path.join(servicePath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    generatedFiles.push('package.json');

    // Generate TypeScript config
    const tsConfig = this.generateTsConfig();
    await fs.writeFile(
      path.join(servicePath, 'tsconfig.json'),
      JSON.stringify(tsConfig, null, 2)
    );
    generatedFiles.push('tsconfig.json');

    // Generate Prisma schema
    const prismaSchema = this.generatePrismaSchema(template, config);
    await fs.writeFile(
      path.join(servicePath, 'prisma/schema.prisma'),
      prismaSchema
    );
    generatedFiles.push('prisma/schema.prisma');

    // Generate environment example
    const envExample = this.generateEnvExample(template, config);
    await fs.writeFile(
      path.join(servicePath, '.env.example'),
      envExample
    );
    generatedFiles.push('.env.example');

    // Generate main server file
    const serverCode = this.generateServerCode(template, config);
    await fs.writeFile(
      path.join(servicePath, 'src/server.ts'),
      serverCode
    );
    generatedFiles.push('src/server.ts');

    // Generate service-specific files
    const serviceCode = this.generateServiceCode(template, config);
    await fs.writeFile(
      path.join(servicePath, `src/services/${config.serviceName}.service.ts`),
      serviceCode
    );
    generatedFiles.push(`src/services/${config.serviceName}.service.ts`);

    // Generate API routes
    const routeCode = this.generateRouteCode(template, config);
    await fs.writeFile(
      path.join(servicePath, `src/api/routes/${config.serviceName}.route.ts`),
      routeCode
    );
    generatedFiles.push(`src/api/routes/${config.serviceName}.route.ts`);

    // Generate job processor
    const jobCode = this.generateJobCode(template, config);
    await fs.writeFile(
      path.join(servicePath, `src/jobs/${config.serviceName}.job.ts`),
      jobCode
    );
    generatedFiles.push(`src/jobs/${config.serviceName}.job.ts`);

    // Generate Docker setup
    const dockerCompose = this.generateDockerCompose(template, config);
    await fs.writeFile(
      path.join(servicePath, 'docker-compose.yml'),
      dockerCompose
    );
    generatedFiles.push('docker-compose.yml');

    // Generate README
    const readme = this.generateReadme(template, config);
    await fs.writeFile(
      path.join(servicePath, 'README.md'),
      readme
    );
    generatedFiles.push('README.md');

    return generatedFiles;
  }

  private generatePackageJson(template: any, config: ServiceGenerationConfig): any {
    return {
      name: config.serviceName.toLowerCase().replace(/\s+/g, '-'),
      version: template.version || '1.0.0',
      description: config.description,
      main: 'dist/server.js',
      scripts: {
        dev: 'tsx watch src/server.ts',
        build: 'tsc',
        start: 'node dist/server.js',
        test: 'jest',
        'test:watch': 'jest --watch',
        'test:coverage': 'jest --coverage',
        lint: 'eslint src --ext .ts',
        format: 'prettier --write "src/**/*.ts"',
      },
      dependencies: {
        express: '^4.18.2',
        cors: '^2.8.5',
        helmet: '^7.1.0',
        compression: '^1.7.4',
        dotenv: '^16.3.1',
        bull: '^4.11.5',
        ioredis: '^5.3.2',
        '@prisma/client': '^5.7.1',
        winston: '^3.11.0',
        axios: '^1.6.2',
        ...(config.ai.useAnthropic && { '@anthropic-ai/sdk': '^0.16.1' }),
      },
      devDependencies: {
        '@types/node': '^20.10.5',
        '@types/express': '^4.17.21',
        typescript: '^5.3.3',
        tsx: '^4.7.0',
        jest: '^29.7.0',
        'ts-jest': '^29.1.1',
        prisma: '^5.7.1',
      },
      keywords: [config.category, 'ai', 'automation', 'finishthisidea'],
      author: config.author,
      license: 'MIT',
    };
  }

  private generateTsConfig(): any {
    return {
      compilerOptions: {
        target: 'ES2022',
        module: 'commonjs',
        lib: ['ES2022'],
        outDir: './dist',
        rootDir: './src',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        moduleResolution: 'node',
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist'],
    };
  }

  private generatePrismaSchema(template: any, config: ServiceGenerationConfig): string {
    return `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum JobStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

model Job {
  id              String    @id @default(uuid())
  status          JobStatus @default(PENDING)
  inputFileUrl    String    @map("input_file_url")
  outputFileUrl   String?   @map("output_file_url")
  progress        Int       @default(0)
  error           String?
  metadata        Json?
  
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  
  @@map("jobs")
}`;
  }

  private generateEnvExample(template: any, config: ServiceGenerationConfig): string {
    return `# Server
PORT=3001
NODE_ENV=development
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/${config.serviceName.toLowerCase()}

# Redis
REDIS_URL=redis://localhost:6379

# Storage
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET=${config.serviceName.toLowerCase()}-storage

${config.ai.useAnthropic ? `
# Claude API
ANTHROPIC_API_KEY=sk-ant-your_key
` : ''}

${config.ai.useOpenAI ? `
# OpenAI API
OPENAI_API_KEY=sk-your_key
` : ''}

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=codellama`;
  }

  private generateServerCode(template: any, config: ServiceGenerationConfig): string {
    return `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { prisma } from './utils/database';
import { ${config.serviceName.replace(/\s+/g, '')}Router } from './api/routes/${config.serviceName}.route';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Initialize database
    await prisma.$connect();
    logger.info('✅ Database connected');

    // Middleware
    app.use(helmet());
    app.use(cors());
    app.use(compression());
    app.use(express.json());

    // Health check
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        service: '${config.serviceName}',
        timestamp: new Date().toISOString() 
      });
    });

    // Routes
    app.use('/api/${config.serviceName.toLowerCase()}', ${config.serviceName.replace(/\s+/g, '')}Router);

    // Start server
    app.listen(PORT, () => {
      logger.info(\`🚀 ${config.serviceName} service running on port \${PORT}\`);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;`;
  }

  private generateServiceCode(template: any, config: ServiceGenerationConfig): string {
    return `import { logger } from '../utils/logger';
import { llmRouter } from '../llm/router';
import { ProcessingError } from '../utils/errors';

export interface ${config.serviceName.replace(/\s+/g, '')}Config {
  // TODO: Define configuration interface
}

export interface ${config.serviceName.replace(/\s+/g, '')}Result {
  outputFileUrl: string;
  processingCost: number;
}

export async function process${config.serviceName.replace(/\s+/g, '')}(
  jobId: string,
  config: ${config.serviceName.replace(/\s+/g, '')}Config,
  progressCallback?: (progress: number) => void
): Promise<${config.serviceName.replace(/\s+/g, '')}Result> {
  try {
    logger.info('Starting ${config.serviceName} processing', { jobId, config });
    
    progressCallback?.(10);
    
    // TODO: Implement your service logic here
    
    // Example AI processing
    const result = await llmRouter.route({
      type: 'generate',
      input: {
        prompt: 'Your service prompt here',
      },
      options: { preferLocal: true, maxCost: 0.25 }
    });
    
    progressCallback?.(90);
    
    // TODO: Package and upload results
    
    progressCallback?.(100);
    
    return {
      outputFileUrl: 'your-result-url',
      processingCost: result.cost,
    };

  } catch (error) {
    logger.error('${config.serviceName} processing failed', { jobId, error });
    throw error;
  }
}`;
  }

  private generateRouteCode(template: any, config: ServiceGenerationConfig): string {
    const routerName = config.serviceName.replace(/\s+/g, '') + 'Router';
    
    return `import { Router } from 'express';
import { process${config.serviceName.replace(/\s+/g, '')} } from '../services/${config.serviceName}.service';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /${config.serviceName.toLowerCase()}
 * Process ${config.serviceName}
 */
router.post('/', async (req, res, next) => {
  try {
    const { jobId, config } = req.body;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'jobId is required',
      });
    }

    // Start processing
    const result = await process${config.serviceName.replace(/\s+/g, '')}(jobId, config);

    res.json({
      success: true,
      data: result,
    });

  } catch (error) {
    next(error);
  }
});

export const ${routerName} = router;`;
  }

  private generateJobCode(template: any, config: ServiceGenerationConfig): string {
    return `import Bull from 'bull';
import { logger } from '../utils/logger';
import { prisma } from '../utils/database';
import { process${config.serviceName.replace(/\s+/g, '')} } from '../services/${config.serviceName}.service';

export const ${config.serviceName.replace(/\s+/g, '').toLowerCase()}Queue = new Bull('${config.serviceName.toLowerCase()}-jobs', {
  redis: process.env.REDIS_URL || 'redis://localhost:6379',
});

${config.serviceName.replace(/\s+/g, '').toLowerCase()}Queue.process(async (job) => {
  const { jobId, config } = job.data;
  
  try {
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'PROCESSING' },
    });

    const result = await process${config.serviceName.replace(/\s+/g, '')}(jobId, config, (progress) => {
      job.progress(progress);
    });

    await prisma.job.update({
      where: { id: jobId },
      data: { 
        status: 'COMPLETED',
        outputFileUrl: result.outputFileUrl,
      },
    });

    return result;

  } catch (error) {
    logger.error('Job failed', { jobId, error });
    
    await prisma.job.update({
      where: { id: jobId },
      data: { 
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    throw error;
  }
});`;
  }

  private generateDockerCompose(template: any, config: ServiceGenerationConfig): string {
    return `version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${config.serviceName.toLowerCase()}
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

${config.ai.models.some(m => m.includes('ollama')) ? `  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama` : ''}

volumes:
  postgres_data:
${config.ai.models.some(m => m.includes('ollama')) ? '  ollama_data:' : ''}`;
  }

  private generateReadme(template: any, config: ServiceGenerationConfig): string {
    return `# ${config.serviceName}

${config.description}

## Features

- AI-powered processing using ${config.ai.models.join(', ')}
- Async job processing with Bull queue
- RESTful API
- PostgreSQL database
- Redis caching
- Docker support

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Start services:
   \`\`\`bash
   docker-compose up -d
   \`\`\`

3. Set up environment:
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your configuration
   \`\`\`

4. Run database migrations:
   \`\`\`bash
   npx prisma db push
   \`\`\`

5. Start development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## API Endpoints

- \`GET /health\` - Health check
- \`POST /api/${config.serviceName.toLowerCase()}\` - Process ${config.serviceName}

## Pricing

- **Base Price**: $${config.pricing.basePrice}
- **Model**: ${config.pricing.model}

## Architecture

Built with:
- Express.js + TypeScript
- Prisma ORM
- Bull Queue
- ${config.ai.useAnthropic ? 'Claude AI' : ''}${config.ai.useOpenAI ? 'OpenAI' : ''}
- Ollama (local AI)

---

Generated by [FinishThisIdea Template Engine](https://finishthisidea.com)
`;
  }

  private registerHelpers(): void {
    Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });

    Handlebars.registerHelper('kebabCase', function(str) {
      return str.toLowerCase().replace(/\s+/g, '-');
    });

    Handlebars.registerHelper('pascalCase', function(str) {
      return str.replace(/(?:^|\s)(\w)/g, (_, c) => c.toUpperCase()).replace(/\s+/g, '');
    });

    Handlebars.registerHelper('each', function(context, options) {
      let ret = '';
      if (context && context.length > 0) {
        for (let i = 0; i < context.length; i++) {
          ret += options.fn(context[i]);
        }
      }
      return ret;
    });
  }
}