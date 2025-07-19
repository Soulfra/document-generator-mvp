# Template Engine Design

## Overview

The template engine is the core of FinishThisIdea's "Build Once, Scale Infinitely" philosophy. It enables rapid creation of new AI-powered services by abstracting common patterns into reusable templates.

## Core Philosophy

```
Traditional: Build each service from scratch → Months of development
Template Engine: Configure and deploy → Hours to production
```

## Architecture

### Template Structure

```
service-template/
├── template.yaml           # Service configuration
├── frontend/              # UI components
│   ├── components/        # Reusable React components
│   ├── pages/            # Next.js pages
│   └── styles/           # Styling templates
├── backend/              # API and processing
│   ├── routes/           # Express routes
│   ├── workers/          # Queue workers
│   └── services/         # Business logic
├── ai/                   # AI integration
│   ├── prompts/          # Prompt templates
│   ├── processors/       # Result processors
│   └── validators/       # Quality checks
├── database/             # Data layer
│   ├── migrations/       # Schema migrations
│   └── models/          # Data models
└── tests/               # Test templates
    ├── unit/            # Unit tests
    └── integration/     # Integration tests
```

## Template Configuration

### Master Template Definition

```yaml
# template.yaml
metadata:
  name: "{{SERVICE_NAME}}"
  version: "1.0.0"
  author: "{{AUTHOR}}"
  description: "{{DESCRIPTION}}"
  category: "{{CATEGORY}}"
  
service:
  type: "{{SERVICE_TYPE}}" # cleanup, generation, analysis, etc.
  pricing:
    base: {{BASE_PRICE}}
    usage: {{USAGE_PRICING}}
  sla:
    processingTime: {{MAX_MINUTES}}
    accuracy: {{MIN_ACCURACY}}
    
infrastructure:
  frontend:
    framework: "next"
    ui: "{{UI_TYPE}}" # upload, form, editor, tinder
    features:
      - "{{FEATURE_1}}"
      - "{{FEATURE_2}}"
  backend:
    framework: "express"
    queue: "bull"
    storage: "s3"
  database:
    primary: "postgresql"
    cache: "redis"
    
ai:
  primary: "{{PRIMARY_MODEL}}"
  fallback: "{{FALLBACK_MODEL}}"
  localFirst: {{LOCAL_FIRST}}
  routing: "{{ROUTING_STRATEGY}}"
  
deployment:
  platform: "{{PLATFORM}}"
  scaling:
    min: {{MIN_INSTANCES}}
    max: {{MAX_INSTANCES}}
  monitoring:
    - "newrelic"
    - "sentry"
```

## Template Types

### 1. Code Processing Template

```typescript
interface CodeProcessingTemplate {
  input: {
    type: 'file' | 'repository' | 'snippet';
    formats: string[];
    maxSize: number;
  };
  
  processing: {
    steps: ProcessingStep[];
    parallelizable: boolean;
    cacheable: boolean;
  };
  
  output: {
    type: 'file' | 'diff' | 'report';
    format: string;
    packaging: 'zip' | 'tar' | 'direct';
  };
}

const cleanupTemplate: CodeProcessingTemplate = {
  input: {
    type: 'file',
    formats: ['.zip', '.tar.gz'],
    maxSize: 50 * 1024 * 1024 // 50MB
  },
  
  processing: {
    steps: [
      { name: 'extract', handler: 'extractArchive' },
      { name: 'analyze', handler: 'analyzeCodebase' },
      { name: 'clean', handler: 'performCleanup' },
      { name: 'package', handler: 'packageResults' }
    ],
    parallelizable: true,
    cacheable: true
  },
  
  output: {
    type: 'file',
    format: 'zip',
    packaging: 'zip'
  }
};
```

### 2. Generation Template

```typescript
interface GenerationTemplate {
  input: {
    schema: JSONSchema;
    validation: ValidationRule[];
  };
  
  generation: {
    model: string;
    prompts: PromptTemplate[];
    iterations: number;
    qualityChecks: QualityCheck[];
  };
  
  output: {
    artifacts: Artifact[];
    documentation: boolean;
    examples: boolean;
  };
}

const apiGeneratorTemplate: GenerationTemplate = {
  input: {
    schema: {
      type: 'object',
      properties: {
        endpoints: { type: 'array' },
        authentication: { type: 'string' },
        database: { type: 'string' }
      }
    },
    validation: [
      { field: 'endpoints', rule: 'minLength', value: 1 }
    ]
  },
  
  generation: {
    model: 'codellama:34b',
    prompts: [
      { name: 'routes', template: 'Generate REST routes for {{endpoints}}' },
      { name: 'models', template: 'Create {{database}} models for endpoints' },
      { name: 'tests', template: 'Write tests for generated API' }
    ],
    iterations: 3,
    qualityChecks: [
      { type: 'syntax', language: 'javascript' },
      { type: 'security', scanner: 'eslint-security' }
    ]
  },
  
  output: {
    artifacts: [
      { name: 'api', path: 'src/api' },
      { name: 'models', path: 'src/models' },
      { name: 'tests', path: 'tests' }
    ],
    documentation: true,
    examples: true
  }
};
```

### 3. Analysis Template

```typescript
interface AnalysisTemplate {
  scanners: Scanner[];
  metrics: Metric[];
  reporting: ReportConfig;
}

const securityAnalysisTemplate: AnalysisTemplate = {
  scanners: [
    { name: 'dependency-check', config: { severity: 'high' } },
    { name: 'secret-scanner', config: { patterns: 'default' } },
    { name: 'vulnerability-scanner', config: { database: 'nvd' } }
  ],
  
  metrics: [
    { name: 'vulnerabilities', aggregation: 'sum' },
    { name: 'risk-score', calculation: 'weighted' },
    { name: 'compliance', standards: ['owasp', 'pci'] }
  ],
  
  reporting: {
    format: 'html',
    sections: ['summary', 'details', 'recommendations'],
    branding: true
  }
};
```

## Template Engine Implementation

### Core Engine

```typescript
class TemplateEngine {
  private templates: Map<string, ServiceTemplate> = new Map();
  private validators: Map<string, Validator> = new Map();
  private generators: Map<string, Generator> = new Map();
  
  async loadTemplate(name: string): Promise<ServiceTemplate> {
    const templatePath = path.join(TEMPLATE_DIR, name);
    const config = await this.loadConfig(templatePath);
    
    return {
      config,
      components: await this.loadComponents(templatePath),
      assets: await this.loadAssets(templatePath)
    };
  }
  
  async generateService(
    templateName: string, 
    params: ServiceParams
  ): Promise<GeneratedService> {
    const template = await this.loadTemplate(templateName);
    
    // Validate parameters
    await this.validateParams(template, params);
    
    // Generate service structure
    const structure = await this.generateStructure(template, params);
    
    // Process templates
    const processed = await this.processTemplates(structure, params);
    
    // Generate additional components
    const extras = await this.generateExtras(template, params);
    
    return {
      name: params.name,
      path: processed.path,
      config: processed.config,
      deployment: extras.deployment,
      documentation: extras.documentation
    };
  }
  
  private async processTemplates(
    structure: ServiceStructure, 
    params: ServiceParams
  ): Promise<ProcessedService> {
    const processor = new TemplateProcessor({
      engine: 'handlebars',
      helpers: this.getHelpers(),
      partials: this.getPartials()
    });
    
    // Process each file
    for (const file of structure.files) {
      const processed = await processor.process(file.content, params);
      await this.writeFile(file.path, processed);
    }
    
    return {
      path: structure.path,
      config: processor.processConfig(structure.config, params)
    };
  }
}
```

### Template Processor

```typescript
class TemplateProcessor {
  private handlebars: typeof Handlebars;
  
  constructor(private config: ProcessorConfig) {
    this.handlebars = Handlebars.create();
    this.registerHelpers();
    this.registerPartials();
  }
  
  private registerHelpers() {
    // String helpers
    this.handlebars.registerHelper('camelCase', (str) => 
      str.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
    );
    
    this.handlebars.registerHelper('pascalCase', (str) => 
      str.replace(/(^|-)([a-z])/g, (g) => g[g.length-1].toUpperCase())
    );
    
    // Conditional helpers
    this.handlebars.registerHelper('ifEquals', function(a, b, options) {
      return a === b ? options.fn(this) : options.inverse(this);
    });
    
    // Array helpers
    this.handlebars.registerHelper('join', (arr, separator) => 
      arr.join(separator || ', ')
    );
    
    // AI-specific helpers
    this.handlebars.registerHelper('promptTemplate', (type) => 
      this.getPromptTemplate(type)
    );
    
    this.handlebars.registerHelper('modelConfig', (model) => 
      this.getModelConfig(model)
    );
  }
  
  async process(template: string, context: any): Promise<string> {
    const compiled = this.handlebars.compile(template);
    return compiled(context);
  }
  
  processConfig(config: any, params: ServiceParams): any {
    const processed = JSON.stringify(config);
    const template = this.handlebars.compile(processed);
    return JSON.parse(template(params));
  }
}
```

## Service Generation CLI

### Command Line Interface

```bash
# Generate new service
npm run generate-service -- \
  --template "code-processor" \
  --name "documentation-generator" \
  --price 3 \
  --description "Generate comprehensive documentation" \
  --ai-model "mistral"

# List available templates
npm run list-templates

# Validate service configuration
npm run validate-service --path ./services/my-service

# Deploy generated service
npm run deploy-service --name "documentation-generator"
```

### Interactive Generator

```typescript
class InteractiveGenerator {
  async run() {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'template',
        message: 'Select service template:',
        choices: await this.getTemplates()
      },
      {
        type: 'input',
        name: 'name',
        message: 'Service name:',
        validate: this.validateServiceName
      },
      {
        type: 'number',
        name: 'price',
        message: 'Service price ($):',
        default: 5
      },
      {
        type: 'checkbox',
        name: 'features',
        message: 'Select features:',
        choices: this.getFeatureOptions()
      },
      {
        type: 'list',
        name: 'aiModel',
        message: 'Primary AI model:',
        choices: this.getModelOptions()
      }
    ]);
    
    const service = await this.generator.generate(answers);
    
    console.log(chalk.green(`✅ Service generated: ${service.name}`));
    console.log(chalk.blue(`📁 Location: ${service.path}`));
    console.log(chalk.yellow(`🚀 Run: npm run start-service ${service.name}`));
  }
}
```

## Template Marketplace

### Publishing Templates

```typescript
interface TemplateMetadata {
  name: string;
  author: string;
  version: string;
  category: string;
  downloads: number;
  rating: number;
  revenue: {
    total: number;
    lastMonth: number;
  };
}

class TemplateMarketplace {
  async publish(template: ServiceTemplate): Promise<PublishResult> {
    // Validate template
    await this.validator.validate(template);
    
    // Check for conflicts
    await this.checkConflicts(template);
    
    // Package template
    const package = await this.packager.package(template);
    
    // Upload to marketplace
    const result = await this.uploader.upload(package);
    
    // Register for revenue sharing
    await this.revenue.register(template.author, result.id);
    
    return result;
  }
  
  async install(templateId: string): Promise<void> {
    // Download template
    const template = await this.downloader.download(templateId);
    
    // Verify signature
    await this.verifier.verify(template);
    
    // Install locally
    await this.installer.install(template);
    
    // Track usage for revenue
    await this.tracker.trackInstall(templateId);
  }
}
```

## Quality Assurance

### Template Validation

```typescript
class TemplateValidator {
  private rules: ValidationRule[] = [
    { name: 'structure', validator: this.validateStructure },
    { name: 'config', validator: this.validateConfig },
    { name: 'security', validator: this.validateSecurity },
    { name: 'performance', validator: this.validatePerformance },
    { name: 'documentation', validator: this.validateDocs }
  ];
  
  async validate(template: ServiceTemplate): Promise<ValidationResult> {
    const results: ValidationError[] = [];
    
    for (const rule of this.rules) {
      try {
        await rule.validator(template);
      } catch (error) {
        results.push({
          rule: rule.name,
          severity: error.severity || 'error',
          message: error.message,
          location: error.location
        });
      }
    }
    
    return {
      valid: results.filter(r => r.severity === 'error').length === 0,
      warnings: results.filter(r => r.severity === 'warning'),
      errors: results.filter(r => r.severity === 'error')
    };
  }
}
```

### Automated Testing

```typescript
class TemplateTestRunner {
  async runTests(template: ServiceTemplate): Promise<TestResults> {
    const suite = new TestSuite(template.name);
    
    // Generate test service
    const testService = await this.generateTestService(template);
    
    // Run unit tests
    suite.add('unit', await this.runUnitTests(testService));
    
    // Run integration tests
    suite.add('integration', await this.runIntegrationTests(testService));
    
    // Run performance tests
    suite.add('performance', await this.runPerformanceTests(testService));
    
    // Run security tests
    suite.add('security', await this.runSecurityTests(testService));
    
    // Cleanup
    await this.cleanup(testService);
    
    return suite.getResults();
  }
}
```

## Template Evolution

### Version Management

```typescript
interface TemplateVersion {
  version: string;
  changes: Change[];
  migrations: Migration[];
  compatibility: {
    breaking: boolean;
    minimumEngine: string;
  };
}

class TemplateVersionManager {
  async upgrade(
    template: string, 
    fromVersion: string, 
    toVersion: string
  ): Promise<void> {
    const migrations = await this.getMigrations(template, fromVersion, toVersion);
    
    for (const migration of migrations) {
      await this.runMigration(migration);
    }
    
    await this.updateVersion(template, toVersion);
  }
}
```

This template engine design enables rapid service creation while maintaining quality and consistency across the platform.