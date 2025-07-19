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
exports.ServiceGenerator = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const child_process_1 = require("child_process");
const handlebars_1 = __importDefault(require("handlebars"));
const logger_1 = require("../../utils/logger");
class ServiceGenerator {
    templatesDir;
    outputDir;
    templates = new Map();
    constructor() {
        this.templatesDir = path.join(__dirname, 'templates');
        this.outputDir = path.join(process.cwd(), 'generated-services');
        this.loadTemplates();
        this.registerHelpers();
    }
    async loadTemplates() {
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
                const compiled = handlebars_1.default.compile(templateContent);
                this.templates.set(file, compiled);
            }
            logger_1.logger.info('Service templates loaded', { count: templateFiles.length });
        }
        catch (error) {
            logger_1.logger.error('Error loading templates', error);
        }
    }
    registerHelpers() {
        handlebars_1.default.registerHelper('capitalize', (str) => {
            return str.charAt(0).toUpperCase() + str.slice(1);
        });
        handlebars_1.default.registerHelper('camelCase', (str) => {
            return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        });
        handlebars_1.default.registerHelper('pascalCase', (str) => {
            const camel = str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
            return camel.charAt(0).toUpperCase() + camel.slice(1);
        });
        handlebars_1.default.registerHelper('eq', (a, b) => a === b);
        handlebars_1.default.registerHelper('includes', (arr, val) => arr?.includes(val));
    }
    async generateService(config) {
        try {
            logger_1.logger.info('Generating new service', { name: config.name });
            const servicePath = path.join(this.outputDir, config.name);
            await fs.mkdir(servicePath, { recursive: true });
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
            const serviceId = `svc_${crypto.randomBytes(12).toString('hex')}`;
            const apiKey = `sk_svc_${crypto.randomBytes(24).toString('hex')}`;
            const templateData = {
                ...config,
                serviceId,
                apiKey,
                timestamp: new Date().toISOString(),
                year: new Date().getFullYear(),
                port: this.generatePort(config.name),
                dockerImage: `finishthisidea/${config.name}:latest`
            };
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
            await this.initializeGit(servicePath);
            if (process.env.AUTO_INSTALL_DEPS !== 'false') {
                await this.installDependencies(servicePath);
            }
            let dockerImage;
            if (process.env.AUTO_BUILD_DOCKER === 'true') {
                dockerImage = await this.buildDockerImage(servicePath, templateData.dockerImage);
            }
            const apiEndpoints = this.extractApiEndpoints(config);
            logger_1.logger.info('Service generated successfully', {
                name: config.name,
                path: servicePath
            });
            return {
                success: true,
                servicePath,
                dockerImage,
                apiEndpoints
            };
        }
        catch (error) {
            logger_1.logger.error('Error generating service', error);
            throw error;
        }
    }
    async generateMainService(servicePath, data) {
        const template = this.templates.get('service.ts.hbs');
        if (!template)
            throw new Error('Service template not found');
        const content = template(data);
        await fs.writeFile(path.join(servicePath, 'src', 'index.ts'), content);
    }
    async generateControllers(servicePath, data) {
        const template = this.templates.get('controller.ts.hbs');
        if (!template)
            throw new Error('Controller template not found');
        const content = template(data);
        await fs.writeFile(path.join(servicePath, 'src', 'controllers', `${data.name}.controller.ts`), content);
    }
    async generateRoutes(servicePath, data) {
        const template = this.templates.get('router.ts.hbs');
        if (!template)
            throw new Error('Router template not found');
        const content = template(data);
        await fs.writeFile(path.join(servicePath, 'src', 'routes', 'index.ts'), content);
    }
    async generateWorkers(servicePath, data) {
        if (!data.workers || data.workers.length === 0)
            return;
        const template = this.templates.get('worker.ts.hbs');
        if (!template)
            throw new Error('Worker template not found');
        for (const worker of data.workers) {
            const workerData = { ...data, worker };
            const content = template(workerData);
            await fs.writeFile(path.join(servicePath, 'src', 'workers', `${worker.name}.worker.ts`), content);
        }
    }
    async generateTypes(servicePath, data) {
        const template = this.templates.get('types.ts.hbs');
        if (!template)
            throw new Error('Types template not found');
        const content = template(data);
        await fs.writeFile(path.join(servicePath, 'src', 'types', 'index.ts'), content);
    }
    async generatePackageJson(servicePath, data) {
        const template = this.templates.get('package.json.hbs');
        if (!template)
            throw new Error('Package.json template not found');
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
        await fs.writeFile(path.join(servicePath, 'package.json'), content);
    }
    async generateDockerFiles(servicePath, data) {
        const dockerfileTemplate = this.templates.get('Dockerfile.hbs');
        if (dockerfileTemplate) {
            const dockerfileContent = dockerfileTemplate(data);
            await fs.writeFile(path.join(servicePath, 'Dockerfile'), dockerfileContent);
        }
        const composeTemplate = this.templates.get('docker-compose.yml.hbs');
        if (composeTemplate) {
            const composeContent = composeTemplate(data);
            await fs.writeFile(path.join(servicePath, 'docker-compose.yml'), composeContent);
        }
    }
    async generateDocumentation(servicePath, data) {
        const template = this.templates.get('README.md.hbs');
        if (!template)
            throw new Error('README template not found');
        const content = template(data);
        await fs.writeFile(path.join(servicePath, 'README.md'), content);
    }
    async generateTests(servicePath, data) {
        const template = this.templates.get('test.spec.ts.hbs');
        if (!template)
            throw new Error('Test template not found');
        const content = template(data);
        await fs.writeFile(path.join(servicePath, 'tests', `${data.name}.spec.ts`), content);
    }
    async generateEnvironmentFile(servicePath, data) {
        const template = this.templates.get('.env.example.hbs');
        if (!template)
            throw new Error('Environment template not found');
        const content = template(data);
        await fs.writeFile(path.join(servicePath, '.env.example'), content);
        await fs.writeFile(path.join(servicePath, '.env'), content);
    }
    async initializeGit(servicePath) {
        try {
            (0, child_process_1.execSync)('git init', { cwd: servicePath });
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
            await fs.writeFile(path.join(servicePath, '.gitignore'), gitignoreContent.trim());
            (0, child_process_1.execSync)('git add .', { cwd: servicePath });
            (0, child_process_1.execSync)('git commit -m "Initial service generation"', { cwd: servicePath });
            logger_1.logger.info('Git repository initialized');
        }
        catch (error) {
            logger_1.logger.warn('Could not initialize git repository', error);
        }
    }
    async installDependencies(servicePath) {
        try {
            logger_1.logger.info('Installing dependencies...');
            (0, child_process_1.execSync)('npm install', {
                cwd: servicePath,
                stdio: 'inherit'
            });
            logger_1.logger.info('Dependencies installed');
        }
        catch (error) {
            logger_1.logger.error('Error installing dependencies', error);
        }
    }
    async buildDockerImage(servicePath, imageName) {
        try {
            logger_1.logger.info('Building Docker image...');
            (0, child_process_1.execSync)(`docker build -t ${imageName} .`, {
                cwd: servicePath,
                stdio: 'inherit'
            });
            logger_1.logger.info('Docker image built', { imageName });
            return imageName;
        }
        catch (error) {
            logger_1.logger.error('Error building Docker image', error);
            throw error;
        }
    }
    generatePort(serviceName) {
        const hash = crypto.createHash('md5').update(serviceName).digest('hex');
        const portBase = 4000;
        const portRange = 1000;
        const offset = parseInt(hash.substring(0, 4), 16) % portRange;
        return portBase + offset;
    }
    extractApiEndpoints(config) {
        if (!config.routes)
            return [];
        return config.routes.map(route => `${route.method} ${route.path}`);
    }
    async getAvailableTemplates() {
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
exports.ServiceGenerator = ServiceGenerator;
//# sourceMappingURL=service-generator.js.map