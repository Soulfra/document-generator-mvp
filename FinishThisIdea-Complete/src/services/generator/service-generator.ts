/**
 * Service Generator
 * Creates new microservices from templates for rapid expansion
 * Enables $3-$5 services to be spun up quickly
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { execSync } from 'child_process';
import Handlebars from 'handlebars';
import { logger } from '../../utils/logger';

interface ServiceConfig {
  name: string;
  displayName: string;
  description: string;
  type: 'api' | 'worker' | 'analyzer' | 'generator';
  pricing: {
    tier: 'basic' | 'standard' | 'premium';
    price: number;
    currency: string;
  };
  features: string[];
  dependencies?: string[];
  envVars?: Record<string, string>;
  routes?: RouteConfig[];
  workers?: WorkerConfig[];
}

interface RouteConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  handler: string;
  middleware?: string[];
  rateLimit?: number;
}

interface WorkerConfig {
  name: string;
  schedule?: string; // cron expression
  concurrency?: number;
  handler: string;
}

export class ServiceGenerator {
  private templatesDir: string;
  private outputDir: string;
  private templates: Map<string, Handlebars.TemplateDelegate> = new Map();

  constructor() {
    this.templatesDir = path.join(__dirname, 'templates');
    this.outputDir = path.join(process.cwd(), 'generated-services');
    
    this.loadTemplates();
    this.registerHelpers();
  }

  /**
   * Load all templates
   */
  private async loadTemplates(): Promise<void> {
    try {
      const templateFiles = [
        'service.ts.hbs',
        'controller.ts.hbs',
        'router.ts.hbs',
        'worker.ts.hbs',
        'types.ts.hbs',
        'package.json.hbs',
        'Dockerfile.hbs',
        'docker-compose.yml.hbs',
        'README.md.hbs',
        '.env.example.hbs',
        'test.spec.ts.hbs'
      ];

      for (const file of templateFiles) {
        const templatePath = path.join(this.templatesDir, file);
        const templateContent = await fs.readFile(templatePath, 'utf-8');
        const compiled = Handlebars.compile(templateContent);
        this.templates.set(file, compiled);
      }

      logger.info('Service templates loaded', { count: templateFiles.length });
    } catch (error) {
      logger.error('Error loading templates', error);
    }
  }

  /**
   * Register Handlebars helpers
   */
  private registerHelpers(): void {
    Handlebars.registerHelper('capitalize', (str: string) => {
      return str.charAt(0).toUpperCase() + str.slice(1);
    });

    Handlebars.registerHelper('camelCase', (str: string) => {
      return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    });

    Handlebars.registerHelper('pascalCase', (str: string) => {
      const camel = str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      return camel.charAt(0).toUpperCase() + camel.slice(1);
    });

    Handlebars.registerHelper('eq', (a: any, b: any) => a === b);
    Handlebars.registerHelper('includes', (arr: any[], val: any) => arr?.includes(val));
  }

  /**
   * Generate a new service
   */
  async generateService(config: ServiceConfig): Promise<{
    success: boolean;
    servicePath: string;
    dockerImage?: string;
    apiEndpoints?: string[];
  }> {
    try {
      logger.info('Generating new service', { name: config.name });

      // Create service directory
      const servicePath = path.join(this.outputDir, config.name);
      await fs.mkdir(servicePath, { recursive: true });

      // Create directory structure
      const directories = [
        'src',
        'src/controllers',
        'src/services',
        'src/routes',
        'src/workers',
        'src/types',
        'src/utils',
        'tests',
        'config'
      ];

      for (const dir of directories) {
        await fs.mkdir(path.join(servicePath, dir), { recursive: true });
      }

      // Generate service ID and API key
      const serviceId = `svc_${crypto.randomBytes(12).toString('hex')}`;
      const apiKey = `sk_svc_${crypto.randomBytes(24).toString('hex')}`;

      // Prepare template data
      const templateData = {
        ...config,
        serviceId,
        apiKey,
        timestamp: new Date().toISOString(),
        year: new Date().getFullYear(),
        port: this.generatePort(config.name),
        dockerImage: `finishthisidea/${config.name}:latest`
      };

      // Generate files from templates
      await this.generateMainService(servicePath, templateData);
      await this.generateControllers(servicePath, templateData);
      await this.generateRoutes(servicePath, templateData);
      await this.generateWorkers(servicePath, templateData);
      await this.generateTypes(servicePath, templateData);
      await this.generatePackageJson(servicePath, templateData);
      await this.generateDockerFiles(servicePath, templateData);
      await this.generateDocumentation(servicePath, templateData);
      await this.generateTests(servicePath, templateData);
      await this.generateEnvironmentFile(servicePath, templateData);

      // Initialize git repository
      await this.initializeGit(servicePath);

      // Install dependencies
      if (process.env.AUTO_INSTALL_DEPS !== 'false') {
        await this.installDependencies(servicePath);
      }

      // Build Docker image if requested
      let dockerImage: string | undefined;
      if (process.env.AUTO_BUILD_DOCKER === 'true') {
        dockerImage = await this.buildDockerImage(servicePath, templateData.dockerImage);
      }

      // Extract API endpoints
      const apiEndpoints = this.extractApiEndpoints(config);

      logger.info('Service generated successfully', { 
        name: config.name,
        path: servicePath 
      });

      return {
        success: true,
        servicePath,
        dockerImage,
        apiEndpoints
      };
    } catch (error) {
      logger.error('Error generating service', error);
      throw error;
    }
  }

  /**
   * Generate main service file
   */
  private async generateMainService(servicePath: string, data: any): Promise<void> {
    const template = this.templates.get('service.ts.hbs');
    if (!template) throw new Error('Service template not found');

    const content = template(data);
    await fs.writeFile(
      path.join(servicePath, 'src', 'index.ts'),
      content
    );
  }

  /**
   * Generate controllers
   */
  private async generateControllers(servicePath: string, data: any): Promise<void> {
    const template = this.templates.get('controller.ts.hbs');
    if (!template) throw new Error('Controller template not found');

    const content = template(data);
    await fs.writeFile(
      path.join(servicePath, 'src', 'controllers', `${data.name}.controller.ts`),
      content
    );
  }

  /**
   * Generate routes
   */
  private async generateRoutes(servicePath: string, data: any): Promise<void> {
    const template = this.templates.get('router.ts.hbs');
    if (!template) throw new Error('Router template not found');

    const content = template(data);
    await fs.writeFile(
      path.join(servicePath, 'src', 'routes', 'index.ts'),
      content
    );
  }

  /**
   * Generate workers
   */
  private async generateWorkers(servicePath: string, data: any): Promise<void> {
    if (!data.workers || data.workers.length === 0) return;

    const template = this.templates.get('worker.ts.hbs');
    if (!template) throw new Error('Worker template not found');

    for (const worker of data.workers) {
      const workerData = { ...data, worker };
      const content = template(workerData);
      await fs.writeFile(
        path.join(servicePath, 'src', 'workers', `${worker.name}.worker.ts`),
        content
      );
    }
  }

  /**
   * Generate type definitions
   */
  private async generateTypes(servicePath: string, data: any): Promise<void> {
    const template = this.templates.get('types.ts.hbs');
    if (!template) throw new Error('Types template not found');

    const content = template(data);
    await fs.writeFile(
      path.join(servicePath, 'src', 'types', 'index.ts'),
      content
    );
  }

  /**
   * Generate package.json
   */
  private async generatePackageJson(servicePath: string, data: any): Promise<void> {
    const template = this.templates.get('package.json.hbs');
    if (!template) throw new Error('Package.json template not found');

    // Add default dependencies
    const defaultDeps = {
      'express': '^4.18.2',
      'cors': '^2.8.5',
      'helmet': '^7.0.0',
      'compression': '^1.7.4',
      'dotenv': '^16.3.1',
      'winston': '^3.11.0',
      'joi': '^17.11.0',
      'bull': '^4.11.5'
    };

    const defaultDevDeps = {
      '@types/node': '^20.10.0',
      '@types/express': '^4.17.21',
      'typescript': '^5.3.2',
      'ts-node': '^10.9.1',
      'nodemon': '^3.0.2',
      'jest': '^29.7.0',
      '@types/jest': '^29.5.10',
      'ts-jest': '^29.1.1'
    };

    const packageData = {
      ...data,
      dependencies: { ...defaultDeps, ...(data.dependencies || {}) },
      devDependencies: { ...defaultDevDeps }
    };

    const content = template(packageData);
    await fs.writeFile(
      path.join(servicePath, 'package.json'),
      content
    );
  }

  /**
   * Generate Docker files
   */
  private async generateDockerFiles(servicePath: string, data: any): Promise<void> {
    // Dockerfile
    const dockerfileTemplate = this.templates.get('Dockerfile.hbs');
    if (dockerfileTemplate) {
      const dockerfileContent = dockerfileTemplate(data);
      await fs.writeFile(
        path.join(servicePath, 'Dockerfile'),
        dockerfileContent
      );
    }

    // docker-compose.yml
    const composeTemplate = this.templates.get('docker-compose.yml.hbs');
    if (composeTemplate) {
      const composeContent = composeTemplate(data);
      await fs.writeFile(
        path.join(servicePath, 'docker-compose.yml'),
        composeContent
      );
    }
  }

  /**
   * Generate documentation
   */
  private async generateDocumentation(servicePath: string, data: any): Promise<void> {
    const template = this.templates.get('README.md.hbs');
    if (!template) throw new Error('README template not found');

    const content = template(data);
    await fs.writeFile(
      path.join(servicePath, 'README.md'),
      content
    );
  }

  /**
   * Generate tests
   */
  private async generateTests(servicePath: string, data: any): Promise<void> {
    const template = this.templates.get('test.spec.ts.hbs');
    if (!template) throw new Error('Test template not found');

    const content = template(data);
    await fs.writeFile(
      path.join(servicePath, 'tests', `${data.name}.spec.ts`),
      content
    );
  }

  /**
   * Generate environment file
   */
  private async generateEnvironmentFile(servicePath: string, data: any): Promise<void> {
    const template = this.templates.get('.env.example.hbs');
    if (!template) throw new Error('Environment template not found');

    const content = template(data);
    await fs.writeFile(
      path.join(servicePath, '.env.example'),
      content
    );

    // Also create actual .env for development
    await fs.writeFile(
      path.join(servicePath, '.env'),
      content
    );
  }

  /**
   * Initialize git repository
   */
  private async initializeGit(servicePath: string): Promise<void> {
    try {
      execSync('git init', { cwd: servicePath });
      
      // Create .gitignore
      const gitignoreContent = `
node_modules/
dist/
.env
.env.local
*.log
.DS_Store
coverage/
.nyc_output/
`;
      await fs.writeFile(
        path.join(servicePath, '.gitignore'),
        gitignoreContent.trim()
      );

      execSync('git add .', { cwd: servicePath });
      execSync('git commit -m "Initial service generation"', { cwd: servicePath });
      
      logger.info('Git repository initialized');
    } catch (error) {
      logger.warn('Could not initialize git repository', error);
    }
  }

  /**
   * Install dependencies
   */
  private async installDependencies(servicePath: string): Promise<void> {
    try {
      logger.info('Installing dependencies...');
      execSync('npm install', { 
        cwd: servicePath,
        stdio: 'inherit'
      });
      logger.info('Dependencies installed');
    } catch (error) {
      logger.error('Error installing dependencies', error);
    }
  }

  /**
   * Build Docker image
   */
  private async buildDockerImage(servicePath: string, imageName: string): Promise<string> {
    try {
      logger.info('Building Docker image...');
      execSync(`docker build -t ${imageName} .`, {
        cwd: servicePath,
        stdio: 'inherit'
      });
      logger.info('Docker image built', { imageName });
      return imageName;
    } catch (error) {
      logger.error('Error building Docker image', error);
      throw error;
    }
  }

  /**
   * Generate port number based on service name
   */
  private generatePort(serviceName: string): number {
    // Generate consistent port based on service name hash
    const hash = crypto.createHash('md5').update(serviceName).digest('hex');
    const portBase = 4000;
    const portRange = 1000;
    const offset = parseInt(hash.substring(0, 4), 16) % portRange;
    return portBase + offset;
  }

  /**
   * Extract API endpoints from config
   */
  private extractApiEndpoints(config: ServiceConfig): string[] {
    if (!config.routes) return [];
    
    return config.routes.map(route => `${route.method} ${route.path}`);
  }

  /**
   * Get available service templates
   */
  async getAvailableTemplates(): Promise<{
    name: string;
    description: string;
    price: number;
    features: string[];
  }[]> {
    return [
      {
        name: 'documentation-generator',
        description: 'Automatically generate comprehensive documentation from your codebase',
        price: 3,
        features: [
          'Markdown documentation',
          'API documentation',
          'Code examples extraction',
          'Dependency graphs',
          'README generation'
        ]
      },
      {
        name: 'test-generator',
        description: 'Generate unit and integration tests for your code',
        price: 5,
        features: [
          'Unit test generation',
          'Integration test scaffolding',
          'Test coverage reports',
          'Mock generation',
          'Test data factories'
        ]
      },
      {
        name: 'api-monitor',
        description: 'Monitor API health and performance',
        price: 5,
        features: [
          'Endpoint monitoring',
          'Response time tracking',
          'Error rate monitoring',
          'Uptime tracking',
          'Alert notifications'
        ]
      },
      {
        name: 'code-metrics',
        description: 'Analyze code quality metrics and complexity',
        price: 3,
        features: [
          'Cyclomatic complexity',
          'Code coverage',
          'Duplication detection',
          'Maintainability index',
          'Technical debt estimation'
        ]
      },
      {
        name: 'dependency-scanner',
        description: 'Scan and analyze project dependencies',
        price: 3,
        features: [
          'Vulnerability scanning',
          'License compliance',
          'Outdated package detection',
          'Security advisories',
          'Upgrade recommendations'
        ]
      }
    ];
  }
}