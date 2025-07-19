# Week 3: Template System & Service Expansion

## Overview

Week 3 transforms FinishThisIdea from a single service into a platform by implementing the template engine. This enables rapid creation of new AI-powered services, setting the foundation for exponential growth.

## Day 15: Template Engine Core

### Morning (4 hours)
Create the template engine foundation:

**src/template-engine/core/template-engine.ts**
```typescript
import * as fs from 'fs-extra';
import * as path from 'path';
import * as yaml from 'js-yaml';
import Handlebars from 'handlebars';
import { TemplateConfig, GeneratedService } from '../types';

export class TemplateEngine {
  private handlebars: typeof Handlebars;
  private templatesDir: string;
  private outputDir: string;
  
  constructor() {
    this.handlebars = Handlebars.create();
    this.templatesDir = path.join(__dirname, '../../../templates');
    this.outputDir = path.join(__dirname, '../../../services');
    this.registerHelpers();
  }
  
  async generateService(
    templateName: string,
    params: ServiceParams
  ): Promise<GeneratedService> {
    console.log(`🚀 Generating service: ${params.name}`);
    
    // Load template
    const template = await this.loadTemplate(templateName);
    
    // Validate parameters
    await this.validateParams(template, params);
    
    // Create service directory
    const servicePath = path.join(this.outputDir, params.name);
    await fs.ensureDir(servicePath);
    
    // Process all template files
    await this.processTemplateFiles(template, params, servicePath);
    
    // Generate additional files
    await this.generateAdditionalFiles(template, params, servicePath);
    
    // Install dependencies
    await this.installDependencies(servicePath);
    
    console.log(`✅ Service generated at: ${servicePath}`);
    
    return {
      name: params.name,
      path: servicePath,
      template: templateName,
      config: this.generateServiceConfig(template, params),
    };
  }
  
  private async loadTemplate(name: string): Promise<TemplateConfig> {
    const templatePath = path.join(this.templatesDir, name);
    const configPath = path.join(templatePath, 'template.yaml');
    
    if (!await fs.pathExists(configPath)) {
      throw new Error(`Template not found: ${name}`);
    }
    
    const configContent = await fs.readFile(configPath, 'utf-8');
    const config = yaml.load(configContent) as TemplateConfig;
    
    return {
      ...config,
      path: templatePath,
    };
  }
  
  private async processTemplateFiles(
    template: TemplateConfig,
    params: ServiceParams,
    outputPath: string
  ) {
    const files = await this.findTemplateFiles(template.path);
    
    for (const file of files) {
      // Skip config files
      if (file.endsWith('.yaml') || file.endsWith('.json')) continue;
      
      // Read template file
      const content = await fs.readFile(file, 'utf-8');
      
      // Process with Handlebars
      const processed = this.processTemplate(content, params);
      
      // Calculate output path
      const relativePath = path.relative(template.path, file);
      const outputFile = path.join(outputPath, relativePath);
      
      // Ensure directory exists
      await fs.ensureDir(path.dirname(outputFile));
      
      // Write processed file
      await fs.writeFile(outputFile, processed);
    }
  }
  
  private processTemplate(content: string, params: any): string {
    const template = this.handlebars.compile(content);
    return template(params);
  }
  
  private registerHelpers() {
    // String manipulation helpers
    this.handlebars.registerHelper('camelCase', (str: string) => 
      str.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
    );
    
    this.handlebars.registerHelper('pascalCase', (str: string) => {
      const camel = str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      return camel.charAt(0).toUpperCase() + camel.slice(1);
    });
    
    this.handlebars.registerHelper('kebabCase', (str: string) =>
      str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
    );
    
    // Conditional helpers
    this.handlebars.registerHelper('ifEquals', function(a, b, options) {
      return a === b ? options.fn(this) : options.inverse(this);
    });
    
    this.handlebars.registerHelper('includes', function(arr, item, options) {
      return arr && arr.includes(item) ? options.fn(this) : options.inverse(this);
    });
    
    // AI-specific helpers
    this.handlebars.registerHelper('aiModel', (type: string) => {
      const models = {
        'code': 'codellama:13b',
        'documentation': 'mistral:7b',
        'analysis': 'codellama:34b',
        'general': 'llama2:13b',
      };
      return models[type] || models.general;
    });
    
    this.handlebars.registerHelper('promptTemplate', (task: string) => {
      return this.getPromptTemplate(task);
    });
  }
  
  private getPromptTemplate(task: string): string {
    const prompts = {
      'cleanup': 'Analyze and clean the following code...',
      'documentation': 'Generate comprehensive documentation for...',
      'api-generation': 'Create a REST API with the following endpoints...',
      'test-generation': 'Write comprehensive tests for...',
    };
    return prompts[task] || 'Process the following...';
  }
}
```

### Afternoon (4 hours)
Create the base service template:

**templates/base-service/template.yaml**
```yaml
name: "{{name}}"
version: "1.0.0"
description: "{{description}}"
author: "{{author}}"

service:
  type: "{{serviceType}}"
  category: "{{category}}"
  
pricing:
  model: "{{pricingModel}}" # fixed, usage, subscription
  base: {{basePrice}}
  {{#ifEquals pricingModel "usage"}}
  usage:
    metric: "{{usageMetric}}"
    rate: {{usageRate}}
  {{/ifEquals}}

infrastructure:
  frontend:
    framework: "next"
    features:
      {{#each frontendFeatures}}
      - "{{this}}"
      {{/each}}
  
  backend:
    framework: "express"
    queue: "bull"
    database: "postgresql"
    cache: "redis"
    
  storage:
    provider: "{{storageProvider}}" # s3, minio, local
    bucket: "{{name}}-storage"

ai:
  providers:
    {{#each aiProviders}}
    - name: "{{this.name}}"
      models:
        {{#each this.models}}
        - "{{this}}"
        {{/each}}
    {{/each}}
  
  routing:
    strategy: "{{routingStrategy}}" # simple, complexity, cost
    localFirst: {{localFirst}}
    
  quality:
    minConfidence: {{minConfidence}}
    validationRequired: {{validationRequired}}

deployment:
  platform: "{{deploymentPlatform}}" # railway, vercel, aws
  environment:
    NODE_ENV: "production"
    {{#each environmentVariables}}
    {{this.key}}: "{{this.value}}"
    {{/each}}
  
  scaling:
    min: {{minInstances}}
    max: {{maxInstances}}
    metric: "{{scalingMetric}}"

monitoring:
  services:
    {{#each monitoringServices}}
    - "{{this}}"
    {{/each}}
  
  alerts:
    email: "{{alertEmail}}"
    slack: "{{slackWebhook}}"
```

**templates/base-service/backend/src/server.ts**
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { {{camelCase name}}Queue } from './queues/{{kebabCase name}}.queue';
import { uploadRouter } from './routes/upload.route';
import { processRouter } from './routes/process.route';
import { webhookRouter } from './routes/webhook.route';
import { healthRouter } from './routes/health.route';
import { errorHandler } from './middleware/error.middleware';
import { rateLimiter } from './middleware/rate-limit.middleware';
import { logger } from './utils/logger';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api', rateLimiter);

// Logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Queue monitoring
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullAdapter({{camelCase name}}Queue)],
  serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());

// API routes
app.use('/api/upload', uploadRouter);
app.use('/api/process', processRouter);
app.use('/api/webhook', webhookRouter);
app.use('/api/health', healthRouter);

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || {{defaultPort}};

app.listen(PORT, () => {
  logger.info(`🚀 {{pascalCase name}} service running on port ${PORT}`);
  logger.info(`📊 Queue dashboard: http://localhost:${PORT}/admin/queues`);
});

export { app };
```

## Day 16: Service Templates

### Morning (4 hours)
Create the documentation generator template:

**templates/documentation-generator/backend/src/services/doc-generator.service.ts**
```typescript
import { BaseAIService } from '@finishthisidea/core';
import { CodeAnalyzer } from './code-analyzer';
import { MarkdownGenerator } from './markdown-generator';

export class DocumentationGenerator extends BaseAIService {
  private analyzer: CodeAnalyzer;
  private generator: MarkdownGenerator;
  
  constructor() {
    super({
      name: 'documentation-generator',
      models: {
        primary: 'mistral:7b',
        fallback: 'gpt-3.5-turbo',
      },
    });
    
    this.analyzer = new CodeAnalyzer();
    this.generator = new MarkdownGenerator();
  }
  
  async generateDocumentation(projectPath: string): Promise<Documentation> {
    // Analyze project structure
    const analysis = await this.analyzer.analyzeProject(projectPath);
    
    // Generate different documentation types
    const docs = await Promise.all([
      this.generateReadme(analysis),
      this.generateApiDocs(analysis),
      this.generateComponentDocs(analysis),
      this.generateArchitectureDocs(analysis),
    ]);
    
    // Create documentation structure
    return this.organizeDocs(docs);
  }
  
  private async generateReadme(analysis: ProjectAnalysis): Promise<DocSection> {
    const prompt = `
      Generate a comprehensive README.md for this project:
      
      Project Structure:
      ${JSON.stringify(analysis.structure, null, 2)}
      
      Technologies: ${analysis.technologies.join(', ')}
      Dependencies: ${analysis.dependencies.length} packages
      
      Include:
      1. Project title and description
      2. Features list
      3. Installation instructions
      4. Usage examples
      5. API overview (if applicable)
      6. Contributing guidelines
      7. License information
      
      Make it professional, clear, and engaging.
    `;
    
    const response = await this.generateWithAI(prompt);
    
    return {
      type: 'readme',
      path: 'README.md',
      content: response,
      metadata: {
        generated: new Date(),
        model: this.currentModel,
      },
    };
  }
  
  private async generateApiDocs(analysis: ProjectAnalysis): Promise<DocSection> {
    if (!analysis.hasApi) {
      return null;
    }
    
    const endpoints = analysis.endpoints;
    const docs = [];
    
    for (const endpoint of endpoints) {
      const prompt = `
        Generate API documentation for this endpoint:
        
        Method: ${endpoint.method}
        Path: ${endpoint.path}
        Handler: ${endpoint.handler}
        
        Code:
        ${endpoint.code}
        
        Include:
        - Description
        - Parameters (path, query, body)
        - Request/response examples
        - Error codes
        - Authentication requirements
        
        Format as OpenAPI/Swagger compatible documentation.
      `;
      
      const doc = await this.generateWithAI(prompt);
      docs.push(doc);
    }
    
    return {
      type: 'api',
      path: 'docs/api.md',
      content: this.combineApiDocs(docs),
      metadata: {
        endpoints: endpoints.length,
        openApiVersion: '3.0.0',
      },
    };
  }
  
  private async generateComponentDocs(analysis: ProjectAnalysis): Promise<DocSection> {
    if (!analysis.hasComponents) {
      return null;
    }
    
    const components = analysis.components;
    const componentDocs = [];
    
    for (const component of components) {
      const prompt = `
        Generate documentation for this React component:
        
        Component: ${component.name}
        Props: ${JSON.stringify(component.props)}
        
        Code:
        ${component.code}
        
        Include:
        - Component description
        - Props documentation with types
        - Usage examples
        - Common patterns
        - Styling options
      `;
      
      const doc = await this.generateWithAI(prompt);
      componentDocs.push({
        name: component.name,
        doc,
      });
    }
    
    return {
      type: 'components',
      path: 'docs/components.md',
      content: this.formatComponentDocs(componentDocs),
      metadata: {
        totalComponents: components.length,
        documented: componentDocs.length,
      },
    };
  }
}
```

### Afternoon (4 hours)
Create the API generator template:

**templates/api-generator/backend/src/services/api-generator.service.ts**
```typescript
import { BaseAIService } from '@finishthisidea/core';
import { SchemaParser } from './schema-parser';
import { CodeGenerator } from './code-generator';
import { TestGenerator } from './test-generator';

export interface APISpec {
  name: string;
  version: string;
  endpoints: EndpointSpec[];
  authentication: AuthSpec;
  database: DatabaseSpec;
}

export class APIGenerator extends BaseAIService {
  private schemaParser: SchemaParser;
  private codeGen: CodeGenerator;
  private testGen: TestGenerator;
  
  constructor() {
    super({
      name: 'api-generator',
      models: {
        primary: 'codellama:34b',
        fallback: 'gpt-4',
      },
    });
    
    this.schemaParser = new SchemaParser();
    this.codeGen = new CodeGenerator();
    this.testGen = new TestGenerator();
  }
  
  async generateAPI(spec: APISpec): Promise<GeneratedAPI> {
    console.log(`🚀 Generating API: ${spec.name}`);
    
    // Parse and validate spec
    const parsed = await this.schemaParser.parse(spec);
    
    // Generate components
    const components = await Promise.all([
      this.generateModels(parsed),
      this.generateRoutes(parsed),
      this.generateControllers(parsed),
      this.generateMiddleware(parsed),
      this.generateValidators(parsed),
      this.generateTests(parsed),
    ]);
    
    // Generate project structure
    const project = await this.createProjectStructure(spec, components);
    
    return project;
  }
  
  private async generateModels(spec: ParsedSpec): Promise<GeneratedCode> {
    const models = [];
    
    for (const endpoint of spec.endpoints) {
      if (!endpoint.model) continue;
      
      const prompt = `
        Generate a ${spec.database.type} model for:
        
        Model: ${endpoint.model.name}
        Fields: ${JSON.stringify(endpoint.model.fields)}
        Relations: ${JSON.stringify(endpoint.model.relations)}
        
        Requirements:
        - Use ${spec.database.orm} ORM
        - Include validation
        - Add indexes for performance
        - Include timestamps
        - Add soft delete if applicable
        
        Generate clean, production-ready code.
      `;
      
      const modelCode = await this.generateWithAI(prompt);
      
      models.push({
        name: endpoint.model.name,
        path: `src/models/${endpoint.model.name}.model.ts`,
        code: modelCode,
      });
    }
    
    return {
      type: 'models',
      files: models,
    };
  }
  
  private async generateRoutes(spec: ParsedSpec): Promise<GeneratedCode> {
    const routeGroups = this.groupEndpointsByResource(spec.endpoints);
    const routes = [];
    
    for (const [resource, endpoints] of routeGroups) {
      const prompt = `
        Generate Express.js routes for ${resource}:
        
        Endpoints:
        ${endpoints.map(e => `${e.method} ${e.path}`).join('\n')}
        
        Requirements:
        - RESTful design
        - Proper HTTP status codes
        - Error handling
        - Input validation middleware
        - Authentication middleware where needed
        - Rate limiting for public endpoints
        
        Include JSDoc comments for each route.
      `;
      
      const routeCode = await this.generateWithAI(prompt);
      
      routes.push({
        name: resource,
        path: `src/routes/${resource}.route.ts`,
        code: routeCode,
      });
    }
    
    return {
      type: 'routes',
      files: routes,
    };
  }
  
  private async generateControllers(spec: ParsedSpec): Promise<GeneratedCode> {
    const controllers = [];
    
    for (const endpoint of spec.endpoints) {
      const prompt = `
        Generate controller function for:
        
        ${endpoint.method} ${endpoint.path}
        Description: ${endpoint.description}
        
        Request:
        - Params: ${JSON.stringify(endpoint.params)}
        - Query: ${JSON.stringify(endpoint.query)}
        - Body: ${JSON.stringify(endpoint.body)}
        
        Response: ${JSON.stringify(endpoint.response)}
        
        Business Logic:
        ${endpoint.businessLogic}
        
        Include:
        - Proper error handling
        - Data validation
        - Database transactions if needed
        - Logging
        - Response formatting
      `;
      
      const controllerCode = await this.generateWithAI(prompt);
      
      controllers.push({
        name: endpoint.operationId,
        path: `src/controllers/${endpoint.controller}.controller.ts`,
        code: controllerCode,
        endpoint,
      });
    }
    
    return {
      type: 'controllers',
      files: this.consolidateControllers(controllers),
    };
  }
  
  private async generateTests(spec: ParsedSpec): Promise<GeneratedCode> {
    const tests = [];
    
    // Unit tests for each endpoint
    for (const endpoint of spec.endpoints) {
      const unitTest = await this.testGen.generateUnitTest(endpoint);
      tests.push(unitTest);
    }
    
    // Integration tests
    const integrationTests = await this.testGen.generateIntegrationTests(spec);
    tests.push(...integrationTests);
    
    // E2E test suite
    const e2eTests = await this.testGen.generateE2ETests(spec);
    tests.push(...e2eTests);
    
    return {
      type: 'tests',
      files: tests,
    };
  }
  
  private async createProjectStructure(
    spec: APISpec,
    components: GeneratedCode[]
  ): Promise<GeneratedAPI> {
    const structure = {
      'src/': {
        'models/': {},
        'routes/': {},
        'controllers/': {},
        'middleware/': {},
        'services/': {},
        'utils/': {},
        'validators/': {},
        'config/': {},
      },
      'tests/': {
        'unit/': {},
        'integration/': {},
        'e2e/': {},
      },
      'docs/': {},
    };
    
    // Place generated files
    for (const component of components) {
      for (const file of component.files) {
        await this.placeFile(structure, file);
      }
    }
    
    // Generate additional files
    await this.generateConfigFiles(spec, structure);
    await this.generateDockerfile(spec, structure);
    await this.generatePackageJson(spec, structure);
    
    return {
      name: spec.name,
      structure,
      spec,
      components,
      metadata: {
        totalEndpoints: spec.endpoints.length,
        totalFiles: this.countFiles(structure),
        estimatedDevTime: this.estimateDevTime(spec),
        generatedAt: new Date(),
      },
    };
  }
}
```

## Day 17: Template CLI & Generator

### Morning (4 hours)
Create the interactive template CLI:

**src/template-engine/cli/index.ts**
```typescript
#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { TemplateEngine } from '../core/template-engine';
import { TemplateRegistry } from '../core/template-registry';

const program = new Command();
const engine = new TemplateEngine();
const registry = new TemplateRegistry();

program
  .name('finish-template')
  .description('Generate new services from templates')
  .version('1.0.0');

program
  .command('generate')
  .alias('g')
  .description('Generate a new service from template')
  .option('-t, --template <name>', 'Template name')
  .option('-n, --name <name>', 'Service name')
  .option('--no-install', 'Skip dependency installation')
  .action(async (options) => {
    try {
      const params = await collectParams(options);
      await generateService(params);
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('list')
  .alias('ls')
  .description('List available templates')
  .action(async () => {
    const templates = await registry.listTemplates();
    
    console.log(chalk.bold('\nAvailable Templates:\n'));
    
    templates.forEach(template => {
      console.log(chalk.green(`  ${template.name}`));
      console.log(chalk.gray(`    ${template.description}`));
      console.log(chalk.gray(`    Category: ${template.category}`));
      console.log(chalk.gray(`    Version: ${template.version}\n`));
    });
  });

program
  .command('create-template')
  .description('Create a new template')
  .action(async () => {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Template name:',
        validate: (input) => input.length > 0,
      },
      {
        type: 'input',
        name: 'description',
        message: 'Template description:',
      },
      {
        type: 'list',
        name: 'category',
        message: 'Template category:',
        choices: [
          'code-processing',
          'generation',
          'analysis',
          'transformation',
          'integration',
        ],
      },
      {
        type: 'checkbox',
        name: 'features',
        message: 'Select features:',
        choices: [
          { name: 'File upload', value: 'upload' },
          { name: 'Real-time processing', value: 'realtime' },
          { name: 'Batch processing', value: 'batch' },
          { name: 'Webhook support', value: 'webhooks' },
          { name: 'API endpoints', value: 'api' },
          { name: 'Dashboard UI', value: 'dashboard' },
        ],
      },
    ]);
    
    const spinner = ora('Creating template...').start();
    
    try {
      await registry.createTemplate(answers);
      spinner.succeed(`Template '${answers.name}' created successfully!`);
    } catch (error) {
      spinner.fail('Failed to create template');
      console.error(error);
    }
  });

async function collectParams(options: any) {
  const templates = await registry.listTemplates();
  
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'template',
      message: 'Select template:',
      choices: templates.map(t => ({
        name: `${t.name} - ${t.description}`,
        value: t.name,
      })),
      when: !options.template,
    },
    {
      type: 'input',
      name: 'name',
      message: 'Service name:',
      validate: (input) => {
        if (!input) return 'Service name is required';
        if (!/^[a-z-]+$/.test(input)) return 'Use lowercase letters and hyphens only';
        return true;
      },
      when: !options.name,
    },
    {
      type: 'input',
      name: 'description',
      message: 'Service description:',
    },
    {
      type: 'list',
      name: 'pricingModel',
      message: 'Pricing model:',
      choices: [
        { name: 'Fixed price', value: 'fixed' },
        { name: 'Usage-based', value: 'usage' },
        { name: 'Subscription', value: 'subscription' },
      ],
    },
    {
      type: 'number',
      name: 'basePrice',
      message: 'Base price ($):',
      default: 5,
    },
    {
      type: 'checkbox',
      name: 'aiProviders',
      message: 'Select AI providers:',
      choices: [
        { name: 'Ollama (Local)', value: 'ollama', checked: true },
        { name: 'OpenAI', value: 'openai' },
        { name: 'Anthropic', value: 'anthropic' },
        { name: 'Cohere', value: 'cohere' },
      ],
    },
    {
      type: 'confirm',
      name: 'localFirst',
      message: 'Prioritize local AI processing?',
      default: true,
    },
  ]);
  
  return {
    template: options.template || answers.template,
    name: options.name || answers.name,
    ...answers,
    skipInstall: options.noInstall,
  };
}

async function generateService(params: any) {
  const spinner = ora(`Generating service: ${params.name}`).start();
  
  try {
    // Generate service
    const result = await engine.generateService(params.template, params);
    
    spinner.succeed('Service generated successfully!');
    
    console.log('\n' + chalk.bold('Next steps:'));
    console.log(chalk.gray(`  cd services/${params.name}`));
    console.log(chalk.gray('  npm run dev'));
    console.log('\n' + chalk.bold('Service details:'));
    console.log(chalk.gray(`  Path: ${result.path}`));
    console.log(chalk.gray(`  Template: ${result.template}`));
    console.log(chalk.gray(`  Price: $${params.basePrice}`));
    
    // Show generated endpoints
    if (result.config.endpoints) {
      console.log('\n' + chalk.bold('API Endpoints:'));
      result.config.endpoints.forEach(endpoint => {
        console.log(chalk.gray(`  ${endpoint.method} ${endpoint.path}`));
      });
    }
    
  } catch (error) {
    spinner.fail('Failed to generate service');
    throw error;
  }
}

program.parse(process.argv);
```

### Afternoon (4 hours)
Create template testing framework:

**src/template-engine/testing/template-tester.ts**
```typescript
import { TemplateEngine } from '../core/template-engine';
import { ServiceValidator } from './service-validator';
import { PerformanceTester } from './performance-tester';
import { IntegrationTester } from './integration-tester';

export class TemplateTester {
  private engine: TemplateEngine;
  private validator: ServiceValidator;
  private perfTester: PerformanceTester;
  private integrationTester: IntegrationTester;
  
  constructor() {
    this.engine = new TemplateEngine();
    this.validator = new ServiceValidator();
    this.perfTester = new PerformanceTester();
    this.integrationTester = new IntegrationTester();
  }
  
  async testTemplate(templateName: string): Promise<TestReport> {
    console.log(`🧪 Testing template: ${templateName}`);
    
    const testParams = this.generateTestParams(templateName);
    const results: TestResult[] = [];
    
    // Test 1: Generation
    results.push(await this.testGeneration(templateName, testParams));
    
    // Test 2: Validation
    results.push(await this.testValidation(templateName, testParams));
    
    // Test 3: Build & Run
    results.push(await this.testBuildAndRun(templateName, testParams));
    
    // Test 4: API Testing
    results.push(await this.testAPI(templateName, testParams));
    
    // Test 5: Performance
    results.push(await this.testPerformance(templateName, testParams));
    
    // Test 6: Integration
    results.push(await this.testIntegration(templateName, testParams));
    
    return this.generateReport(templateName, results);
  }
  
  private async testGeneration(
    templateName: string,
    params: any
  ): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const service = await this.engine.generateService(templateName, params);
      
      return {
        test: 'generation',
        status: 'passed',
        duration: Date.now() - startTime,
        details: {
          servicePath: service.path,
          filesGenerated: await this.countFiles(service.path),
        },
      };
    } catch (error) {
      return {
        test: 'generation',
        status: 'failed',
        duration: Date.now() - startTime,
        error: error.message,
      };
    }
  }
  
  private async testBuildAndRun(
    templateName: string,
    params: any
  ): Promise<TestResult> {
    const servicePath = `./test-services/${params.name}`;
    
    try {
      // Install dependencies
      await this.runCommand('npm install', servicePath);
      
      // Build
      await this.runCommand('npm run build', servicePath);
      
      // Start service
      const process = await this.startService(servicePath);
      
      // Health check
      const health = await this.checkHealth(`http://localhost:${params.port}`);
      
      // Stop service
      process.kill();
      
      return {
        test: 'build-and-run',
        status: health ? 'passed' : 'failed',
        details: { health },
      };
    } catch (error) {
      return {
        test: 'build-and-run',
        status: 'failed',
        error: error.message,
      };
    }
  }
  
  private async testAPI(
    templateName: string,
    params: any
  ): Promise<TestResult> {
    const testCases = [
      {
        name: 'Upload endpoint',
        method: 'POST',
        path: '/api/upload',
        body: { test: true },
        expectedStatus: 200,
      },
      {
        name: 'Process endpoint',
        method: 'POST',
        path: '/api/process',
        body: { jobId: 'test-123' },
        expectedStatus: 200,
      },
      {
        name: 'Status endpoint',
        method: 'GET',
        path: '/api/status/test-123',
        expectedStatus: 200,
      },
    ];
    
    const results = await Promise.all(
      testCases.map(tc => this.runAPITest(tc))
    );
    
    const passed = results.every(r => r.passed);
    
    return {
      test: 'api',
      status: passed ? 'passed' : 'failed',
      details: { testCases: results },
    };
  }
  
  private async testPerformance(
    templateName: string,
    params: any
  ): Promise<TestResult> {
    const metrics = await this.perfTester.run({
      servicePath: `./test-services/${params.name}`,
      duration: 60, // 1 minute
      concurrency: 10,
      requestsPerSecond: 100,
    });
    
    const passed = metrics.p95 < 1000 && metrics.errorRate < 0.01;
    
    return {
      test: 'performance',
      status: passed ? 'passed' : 'failed',
      details: metrics,
    };
  }
}
```

## Day 18: New Service Implementation

### Morning (4 hours)
Implement the test generator service using templates:

```bash
# Generate test generator service
npm run generate-service -- \
  --template "code-processor" \
  --name "test-generator" \
  --price 4 \
  --description "Generate comprehensive test suites"
```

**services/test-generator/src/services/test-generator.service.ts**
```typescript
import { BaseAIService } from '@finishthisidea/core';
import { TestAnalyzer } from './test-analyzer';
import { TestBuilder } from './test-builder';

export class TestGeneratorService extends BaseAIService {
  private analyzer: TestAnalyzer;
  private builder: TestBuilder;
  
  constructor() {
    super({
      name: 'test-generator',
      models: {
        primary: 'codellama:13b',
        fallback: 'gpt-4',
      },
    });
    
    this.analyzer = new TestAnalyzer();
    this.builder = new TestBuilder();
  }
  
  async generateTests(codebasePath: string, options: TestOptions): Promise<TestSuite> {
    // Analyze codebase
    const analysis = await this.analyzer.analyze(codebasePath);
    
    // Determine what to test
    const testPlan = await this.createTestPlan(analysis, options);
    
    // Generate tests in parallel
    const tests = await Promise.all([
      this.generateUnitTests(testPlan),
      this.generateIntegrationTests(testPlan),
      this.generateE2ETests(testPlan),
    ]);
    
    // Build test suite
    return this.builder.buildSuite(tests, analysis);
  }
  
  private async generateUnitTests(plan: TestPlan): Promise<GeneratedTests> {
    const unitTests = [];
    
    for (const module of plan.modules) {
      const prompt = `
        Generate comprehensive unit tests for this module:
        
        Module: ${module.name}
        Functions: ${module.functions.map(f => f.name).join(', ')}
        
        Code:
        ${module.code}
        
        Requirements:
        - Test all functions
        - Include edge cases
        - Test error conditions
        - Mock external dependencies
        - Use ${plan.framework} testing framework
        - Follow ${plan.style} testing style
        
        Generate complete, runnable tests.
      `;
      
      const tests = await this.generateWithAI(prompt);
      
      unitTests.push({
        module: module.name,
        path: `tests/unit/${module.name}.test.ts`,
        code: tests,
        coverage: await this.estimateCoverage(tests, module),
      });
    }
    
    return {
      type: 'unit',
      tests: unitTests,
      totalTests: this.countTests(unitTests),
    };
  }
  
  private async generateIntegrationTests(plan: TestPlan): Promise<GeneratedTests> {
    const integrationTests = [];
    
    // Identify integration points
    const integrations = this.identifyIntegrations(plan);
    
    for (const integration of integrations) {
      const prompt = `
        Generate integration tests for:
        
        Integration: ${integration.name}
        Type: ${integration.type}
        Components: ${integration.components.join(', ')}
        
        Test scenarios:
        ${integration.scenarios.map(s => `- ${s}`).join('\n')}
        
        Requirements:
        - Test component interactions
        - Include database operations
        - Test API integrations
        - Verify data flow
        - Handle async operations
        
        Use ${plan.framework} with proper setup/teardown.
      `;
      
      const tests = await this.generateWithAI(prompt);
      
      integrationTests.push({
        name: integration.name,
        path: `tests/integration/${integration.name}.test.ts`,
        code: tests,
      });
    }
    
    return {
      type: 'integration',
      tests: integrationTests,
    };
  }
  
  private async generateE2ETests(plan: TestPlan): Promise<GeneratedTests> {
    if (!plan.hasUI && !plan.hasAPI) {
      return { type: 'e2e', tests: [] };
    }
    
    const userFlows = this.identifyUserFlows(plan);
    const e2eTests = [];
    
    for (const flow of userFlows) {
      const prompt = `
        Generate E2E test for user flow:
        
        Flow: ${flow.name}
        Steps:
        ${flow.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}
        
        Requirements:
        - Use ${plan.e2eFramework || 'Playwright'}
        - Test complete user journey
        - Include assertions for each step
        - Handle dynamic content
        - Test error scenarios
        - Add screenshots on failure
        
        Make it robust and maintainable.
      `;
      
      const test = await this.generateWithAI(prompt);
      
      e2eTests.push({
        flow: flow.name,
        path: `tests/e2e/${flow.name}.test.ts`,
        code: test,
      });
    }
    
    return {
      type: 'e2e',
      tests: e2eTests,
    };
  }
}
```

### Afternoon (4 hours)
Create the security analyzer service:

**services/security-analyzer/src/services/security-analyzer.service.ts**
```typescript
import { BaseAIService } from '@finishthisidea/core';
import { VulnerabilityScanner } from './vulnerability-scanner';
import { DependencyChecker } from './dependency-checker';
import { CodeAuditor } from './code-auditor';

export class SecurityAnalyzerService extends BaseAIService {
  private scanner: VulnerabilityScanner;
  private depChecker: DependencyChecker;
  private auditor: CodeAuditor;
  
  constructor() {
    super({
      name: 'security-analyzer',
      models: {
        primary: 'codellama:34b',
        fallback: 'gpt-4',
      },
    });
    
    this.scanner = new VulnerabilityScanner();
    this.depChecker = new DependencyChecker();
    this.auditor = new CodeAuditor();
  }
  
  async analyzeProject(projectPath: string): Promise<SecurityReport> {
    console.log('🔒 Starting security analysis...');
    
    // Run all security checks in parallel
    const [
      vulnerabilities,
      dependencies,
      codeIssues,
      configuration,
      secrets,
    ] = await Promise.all([
      this.scanVulnerabilities(projectPath),
      this.checkDependencies(projectPath),
      this.auditCode(projectPath),
      this.checkConfiguration(projectPath),
      this.scanForSecrets(projectPath),
    ]);
    
    // Generate recommendations
    const recommendations = await this.generateRecommendations({
      vulnerabilities,
      dependencies,
      codeIssues,
      configuration,
      secrets,
    });
    
    // Calculate risk score
    const riskScore = this.calculateRiskScore({
      vulnerabilities,
      dependencies,
      codeIssues,
    });
    
    return {
      summary: {
        riskScore,
        criticalIssues: this.countCritical(vulnerabilities),
        totalIssues: this.countTotal(vulnerabilities),
        categories: this.categorizeIssues(vulnerabilities),
      },
      vulnerabilities,
      dependencies,
      codeIssues,
      configuration,
      secrets,
      recommendations,
      report: await this.generateReport({
        vulnerabilities,
        dependencies,
        codeIssues,
        recommendations,
      }),
    };
  }
  
  private async scanVulnerabilities(
    projectPath: string
  ): Promise<Vulnerability[]> {
    const vulnerabilities = [];
    
    // OWASP Top 10 checks
    const owaspChecks = [
      this.checkInjection(projectPath),
      this.checkBrokenAuth(projectPath),
      this.checkSensitiveData(projectPath),
      this.checkXXE(projectPath),
      this.checkAccessControl(projectPath),
      this.checkSecurityMisconfig(projectPath),
      this.checkXSS(projectPath),
      this.checkDeserialization(projectPath),
      this.checkComponents(projectPath),
      this.checkLogging(projectPath),
    ];
    
    const results = await Promise.all(owaspChecks);
    results.forEach(r => vulnerabilities.push(...r));
    
    return vulnerabilities;
  }
  
  private async checkInjection(projectPath: string): Promise<Vulnerability[]> {
    const files = await this.findSourceFiles(projectPath);
    const vulnerabilities = [];
    
    for (const file of files) {
      const content = await this.readFile(file);
      
      // SQL Injection
      const sqlPatterns = [
        /query\s*\(\s*['"`].*\+.*['"`]\s*\)/g,
        /execute\s*\(\s*['"`].*\$\{.*\}.*['"`]\s*\)/g,
        /raw\s*\(\s*['"`].*\+.*['"`]\s*\)/g,
      ];
      
      for (const pattern of sqlPatterns) {
        const matches = content.matchAll(pattern);
        for (const match of matches) {
          const prompt = `
            Analyze this code for SQL injection vulnerability:
            
            Code snippet:
            ${this.getCodeContext(content, match.index)}
            
            Is this vulnerable to SQL injection? If yes, explain why and provide a secure alternative.
          `;
          
          const analysis = await this.generateWithAI(prompt);
          
          if (analysis.isVulnerable) {
            vulnerabilities.push({
              type: 'SQL Injection',
              severity: 'critical',
              file,
              line: this.getLineNumber(content, match.index),
              description: analysis.description,
              recommendation: analysis.recommendation,
              code: match[0],
            });
          }
        }
      }
      
      // Command Injection
      const cmdPatterns = [
        /exec\s*\(\s*.*\+.*\)/g,
        /spawn\s*\(\s*.*\$\{.*\}.*\)/g,
        /system\s*\(\s*['"`].*\+.*['"`]\s*\)/g,
      ];
      
      // Similar pattern for other injection types...
    }
    
    return vulnerabilities;
  }
}
```

## Day 19: Template Marketplace

### Morning (4 hours)
Build the template marketplace infrastructure:

**src/template-marketplace/marketplace.service.ts**
```typescript
import { TemplateRegistry } from '../template-engine/core/template-registry';
import { RevenueSharing } from './revenue-sharing';
import { QualityControl } from './quality-control';

export class TemplateMarketplace {
  private registry: TemplateRegistry;
  private revenue: RevenueSharing;
  private qc: QualityControl;
  
  constructor() {
    this.registry = new TemplateRegistry();
    this.revenue = new RevenueSharing();
    this.qc = new QualityControl();
  }
  
  async publishTemplate(
    template: Template,
    author: Author
  ): Promise<PublishResult> {
    // Quality checks
    const qualityReport = await this.qc.validate(template);
    if (!qualityReport.passed) {
      throw new Error(`Quality check failed: ${qualityReport.issues.join(', ')}`);
    }
    
    // Security audit
    const securityReport = await this.qc.auditSecurity(template);
    if (securityReport.hasVulnerabilities) {
      throw new Error('Security vulnerabilities detected');
    }
    
    // Performance testing
    const perfReport = await this.qc.testPerformance(template);
    if (!perfReport.meetsStandards) {
      throw new Error('Performance standards not met');
    }
    
    // Register template
    const registered = await this.registry.register({
      ...template,
      author,
      publishedAt: new Date(),
      version: '1.0.0',
      downloads: 0,
      rating: 0,
      reviews: [],
    });
    
    // Set up revenue sharing
    await this.revenue.setupSharing({
      templateId: registered.id,
      authorId: author.id,
      revenueShare: 0.7, // 70% to author
    });
    
    // Deploy to CDN
    await this.deployToCDN(registered);
    
    return {
      templateId: registered.id,
      publishedUrl: `https://marketplace.finishthisidea.com/templates/${registered.id}`,
      dashboardUrl: `https://dashboard.finishthisidea.com/templates/${registered.id}`,
    };
  }
  
  async installTemplate(
    templateId: string,
    userId: string
  ): Promise<InstallResult> {
    // Get template
    const template = await this.registry.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }
    
    // Check permissions
    if (template.premium && !await this.hasAccess(userId, templateId)) {
      throw new Error('Premium template - purchase required');
    }
    
    // Download template
    const downloaded = await this.downloadTemplate(template);
    
    // Install locally
    const installed = await this.installLocally(downloaded, userId);
    
    // Track installation
    await this.trackInstallation({
      templateId,
      userId,
      version: template.version,
      timestamp: new Date(),
    });
    
    // Update download count
    await this.registry.incrementDownloads(templateId);
    
    // Calculate revenue if applicable
    if (template.premium) {
      await this.revenue.recordUsage({
        templateId,
        userId,
        amount: template.price,
      });
    }
    
    return {
      installed: true,
      path: installed.path,
      template: template.name,
      version: template.version,
    };
  }
  
  async searchTemplates(query: SearchQuery): Promise<SearchResults> {
    const templates = await this.registry.search({
      text: query.text,
      category: query.category,
      priceRange: query.priceRange,
      minRating: query.minRating,
      features: query.features,
    });
    
    // Sort by relevance
    const sorted = this.sortByRelevance(templates, query);
    
    // Add analytics
    for (const template of sorted) {
      template.analytics = await this.getAnalytics(template.id);
    }
    
    return {
      templates: sorted,
      total: sorted.length,
      facets: this.calculateFacets(sorted),
    };
  }
  
  async getTemplateAnalytics(templateId: string): Promise<TemplateAnalytics> {
    const [
      downloads,
      revenue,
      usage,
      feedback,
    ] = await Promise.all([
      this.getDownloadStats(templateId),
      this.revenue.getTemplateRevenue(templateId),
      this.getUsageStats(templateId),
      this.getFeedbackStats(templateId),
    ]);
    
    return {
      downloads: {
        total: downloads.total,
        lastMonth: downloads.lastMonth,
        trend: downloads.trend,
        byCountry: downloads.byCountry,
      },
      revenue: {
        total: revenue.total,
        lastMonth: revenue.lastMonth,
        averagePerUser: revenue.average,
        projectedAnnual: revenue.projected,
      },
      usage: {
        activeUsers: usage.active,
        averageUsagePerDay: usage.daily,
        popularFeatures: usage.features,
      },
      feedback: {
        rating: feedback.rating,
        reviews: feedback.totalReviews,
        sentiment: feedback.sentiment,
        commonIssues: feedback.issues,
      },
    };
  }
}
```

### Afternoon (4 hours)
Create developer dashboard:

**src/frontend/pages/dashboard/templates.tsx**
```tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import TemplateCard from '../../components/TemplateCard';
import AnalyticsDashboard from '../../components/AnalyticsDashboard';
import RevenueChart from '../../components/RevenueChart';

export default function TemplatesDashboard() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadDashboardData();
  }, []);
  
  async function loadDashboardData() {
    try {
      const [templatesData, analyticsData, revenueData] = await Promise.all([
        fetch('/api/my-templates').then(r => r.json()),
        fetch('/api/my-analytics').then(r => r.json()),
        fetch('/api/my-revenue').then(r => r.json()),
      ]);
      
      setTemplates(templatesData);
      setAnalytics(analyticsData);
      setRevenue(revenueData);
    } finally {
      setLoading(false);
    }
  }
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Template Dashboard</h1>
        
        {/* Revenue Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Revenue"
            value={`$${revenue.total.toLocaleString()}`}
            change={revenue.totalChange}
            icon="💰"
          />
          <MetricCard
            title="This Month"
            value={`$${revenue.thisMonth.toLocaleString()}`}
            change={revenue.monthChange}
            icon="📈"
          />
          <MetricCard
            title="Active Users"
            value={analytics.activeUsers.toLocaleString()}
            change={analytics.userChange}
            icon="👥"
          />
          <MetricCard
            title="Avg Rating"
            value={analytics.averageRating.toFixed(1)}
            subtitle={`${analytics.totalReviews} reviews`}
            icon="⭐"
          />
        </div>
        
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Revenue Trend</h2>
          <RevenueChart data={revenue.history} />
        </div>
        
        {/* Templates Grid */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Your Templates</h2>
            <button
              onClick={() => router.push('/templates/new')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create New Template
            </button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {templates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onEdit={() => router.push(`/templates/${template.id}/edit`)}
                onAnalytics={() => setSelectedTemplate(template)}
              />
            ))}
          </div>
        </div>
        
        {/* Detailed Analytics */}
        {selectedTemplate && (
          <AnalyticsModal
            template={selectedTemplate}
            onClose={() => setSelectedTemplate(null)}
          />
        )}
      </div>
    </div>
  );
}

function MetricCard({ title, value, change, subtitle, icon }) {
  const isPositive = change > 0;
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {change !== undefined && (
            <p className={`text-sm mt-2 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '↑' : '↓'} {Math.abs(change)}%
            </p>
          )}
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}
```

## Day 20-21: Testing & Polish

### Day 20 Morning: Integration Testing
- Test template generation with real examples
- Verify all generated services work correctly
- Test marketplace functionality
- Performance benchmarking

### Day 20 Afternoon: Documentation
- Create template developer guide
- Document best practices
- Create video tutorials
- Update main documentation

### Day 21: Launch Preparation
- Deploy template marketplace
- Set up monitoring
- Create launch materials
- Prepare demo templates

## Weekend: Template Hackathon

### Saturday: Build Templates
- Create 10+ production-ready templates
- Cover major use cases
- Test with real projects
- Gather feedback

### Sunday: Marketing & Launch
- Launch on Product Hunt
- Share on social media
- Developer outreach
- Community building

## Key Achievements This Week

1. **Template Engine**
   - Fully functional template system
   - 15+ customizable parameters
   - Instant service generation

2. **Service Expansion**
   - Documentation Generator ($3)
   - API Generator ($5)
   - Test Generator ($4)
   - Security Analyzer ($7)

3. **Template Marketplace**
   - Publishing system
   - Revenue sharing (70/30)
   - Analytics dashboard
   - Quality control

4. **Developer Experience**
   - Interactive CLI
   - Comprehensive testing
   - Rich documentation
   - Video tutorials

## Metrics

- Template generation time: <30 seconds
- New service deployment: <5 minutes
- Marketplace templates: 25+
- Developer signups: 150+

## Revenue Impact

- Week 3 revenue: $3,500
- New services launched: 4
- Template sales: $800
- Projected month 2: $15,000

## Next Steps

Week 4 will focus on:
1. Advanced AI features
2. Enterprise capabilities
3. Team collaboration
4. White-label options
5. Strategic partnerships