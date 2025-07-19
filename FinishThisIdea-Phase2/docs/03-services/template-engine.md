# Template Engine Service

## Overview

The Template Engine Service powers FinishThisIdea's ability to generate and manage reusable code templates. It enables developers to create, share, and monetize code templates while providing AI-powered customization and generation capabilities.

## Service Details

**Price**: 
- Template Usage: Free with any service
- Template Creation: Free
- Template Marketplace: 70% revenue share to creators
- Custom Template Generation: $5-25

**Processing Time**: 
- Template application: < 1 minute
- Custom generation: 2-5 minutes
- Template validation: Real-time

## Core Concepts

### Template Structure

```yaml
# template.yaml
metadata:
  name: "SaaS Starter Kit"
  version: "1.0.0"
  author: "@developer"
  price: 15
  category: "full-stack"
  tags: ["nextjs", "stripe", "auth", "typescript"]
  description: "Production-ready SaaS boilerplate"
  
configuration:
  required:
    - projectName: string
    - database: enum[postgresql, mysql, mongodb]
    - authProvider: enum[auth0, clerk, supabase]
  optional:
    - stripePricing: boolean
    - emailProvider: enum[sendgrid, ses, resend]
    - analytics: boolean
    
structure:
  directories:
    - src/
    - src/components/
    - src/pages/
    - src/api/
    - src/lib/
    - tests/
    - docs/
    
files:
  - path: "package.json"
    template: "templates/package.json.hbs"
  - path: ".env.example"
    template: "templates/env.hbs"
  - path: "src/pages/index.tsx"
    template: "templates/homepage.tsx.hbs"
    
processors:
  - type: "dependency-installer"
    config:
      manager: "npm"
      command: "install"
  - type: "code-formatter"
    config:
      tool: "prettier"
  - type: "git-initializer"
    config:
      initialCommit: true
```

### Template Files (Handlebars)

```handlebars
{{!-- templates/package.json.hbs --}}
{
  "name": "{{projectName}}",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "jest",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    {{#if (eq database "postgresql")}}
    "@prisma/client": "^5.7.0",
    "prisma": "^5.7.0",
    {{/if}}
    {{#if stripePricing}}
    "stripe": "^14.0.0",
    "@stripe/stripe-js": "^2.2.0",
    {{/if}}
    {{#if (eq authProvider "clerk")}}
    "@clerk/nextjs": "^4.27.0",
    {{/if}}
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

## Template Engine Architecture

### 1. Template Registry

```typescript
class TemplateRegistry {
  private templates = new Map<string, Template>();
  private marketplace = new MarketplaceConnection();
  
  async register(template: Template): Promise<string> {
    // Validate template structure
    const validation = await this.validateTemplate(template);
    if (!validation.valid) {
      throw new ValidationError(validation.errors);
    }
    
    // Generate unique ID
    const templateId = generateTemplateId(template);
    
    // Store in registry
    this.templates.set(templateId, template);
    
    // Publish to marketplace if public
    if (template.visibility === 'public') {
      await this.marketplace.publish(template);
    }
    
    return templateId;
  }
  
  async search(query: TemplateQuery): Promise<Template[]> {
    const results = [];
    
    // Search local templates
    for (const template of this.templates.values()) {
      if (this.matchesQuery(template, query)) {
        results.push(template);
      }
    }
    
    // Search marketplace
    if (query.includeMarketplace) {
      const marketplaceResults = await this.marketplace.search(query);
      results.push(...marketplaceResults);
    }
    
    // Sort by relevance
    return this.sortByRelevance(results, query);
  }
}
```

### 2. Template Processor

```typescript
class TemplateProcessor {
  private handlebars: Handlebars;
  private validators = new Map<string, Validator>();
  
  constructor() {
    this.handlebars = Handlebars.create();
    this.registerHelpers();
    this.registerPartials();
  }
  
  async process(
    template: Template, 
    config: TemplateConfig
  ): Promise<ProcessedTemplate> {
    // Validate configuration
    this.validateConfig(template, config);
    
    // Process file templates
    const files = await this.processFiles(template, config);
    
    // Apply processors
    const processed = await this.applyProcessors(
      files,
      template.processors,
      config
    );
    
    // Generate metadata
    const metadata = this.generateMetadata(template, config);
    
    return {
      files: processed,
      metadata,
      instructions: this.generateInstructions(template, config)
    };
  }
  
  private async processFiles(
    template: Template,
    config: TemplateConfig
  ): Promise<ProcessedFile[]> {
    const files: ProcessedFile[] = [];
    
    for (const fileSpec of template.files) {
      // Load template content
      const templateContent = await this.loadTemplate(fileSpec.template);
      
      // Compile with Handlebars
      const compiled = this.handlebars.compile(templateContent);
      
      // Generate content
      const content = compiled(config);
      
      // Create processed file
      files.push({
        path: this.processPath(fileSpec.path, config),
        content,
        mode: fileSpec.mode || '644'
      });
    }
    
    return files;
  }
}
```

### 3. AI-Powered Template Generation

```typescript
class AITemplateGenerator {
  private llmRouter: LLMRouter;
  private templateAnalyzer: TemplateAnalyzer;
  
  async generateTemplate(
    description: string,
    examples?: CodeExample[]
  ): Promise<Template> {
    // Analyze requirements
    const requirements = await this.analyzeRequirements(description);
    
    // Find similar templates
    const similar = await this.findSimilarTemplates(requirements);
    
    // Generate template structure
    const structure = await this.llmRouter.generate({
      prompt: this.buildGenerationPrompt(requirements, similar),
      type: 'template-generation',
      examples
    });
    
    // Validate and refine
    const refined = await this.refineTemplate(structure);
    
    // Test the template
    const tested = await this.testTemplate(refined);
    
    return tested;
  }
  
  private buildGenerationPrompt(
    requirements: Requirements,
    similar: Template[]
  ): string {
    return `
Generate a reusable code template based on these requirements:

${requirements.description}

Technical requirements:
- Framework: ${requirements.framework}
- Language: ${requirements.language}
- Features: ${requirements.features.join(', ')}

Similar templates for reference:
${similar.map(t => `- ${t.name}: ${t.description}`).join('\n')}

Generate a complete template.yaml file with:
1. Metadata (name, description, tags)
2. Configuration options
3. File structure
4. Template files with Handlebars syntax
5. Post-processing steps
`;
  }
}
```

### 4. Template Marketplace

```typescript
interface MarketplaceTemplate {
  id: string;
  metadata: TemplateMetadata;
  author: {
    id: string;
    username: string;
    reputation: number;
  };
  pricing: {
    price: number;
    currency: 'USD';
    revenueShare: number; // 0.7 (70% to creator)
  };
  stats: {
    downloads: number;
    revenue: number;
    rating: number;
    reviews: Review[];
  };
  preview: {
    files: string[];
    demo?: string;
    screenshots: string[];
  };
}

class TemplateMarketplace {
  async publish(template: Template, pricing: PricingConfig) {
    // Validate template quality
    const quality = await this.assessQuality(template);
    if (quality.score < 0.8) {
      throw new QualityError('Template quality too low', quality);
    }
    
    // Generate preview
    const preview = await this.generatePreview(template);
    
    // Create marketplace listing
    const listing: MarketplaceTemplate = {
      id: generateId(),
      metadata: template.metadata,
      author: await this.getAuthorInfo(),
      pricing: {
        price: pricing.price,
        currency: 'USD',
        revenueShare: 0.7
      },
      stats: {
        downloads: 0,
        revenue: 0,
        rating: 0,
        reviews: []
      },
      preview
    };
    
    // Publish to marketplace
    await this.db.marketplace.create(listing);
    
    // Index for search
    await this.indexTemplate(listing);
    
    return listing;
  }
}
```

## Template Categories

### 1. Starter Templates

```typescript
const starterTemplates = [
  {
    name: "Next.js Starter",
    price: 0, // Free
    includes: [
      "Basic routing",
      "TypeScript setup",
      "Tailwind CSS",
      "ESLint config"
    ]
  },
  {
    name: "Express API Starter",
    price: 0, // Free
    includes: [
      "REST API structure",
      "Database connection",
      "Authentication middleware",
      "Error handling"
    ]
  }
];
```

### 2. Professional Templates

```typescript
const professionalTemplates = [
  {
    name: "SaaS Boilerplate",
    price: 25,
    includes: [
      "Multi-tenant architecture",
      "Stripe subscription billing",
      "Admin dashboard",
      "Email templates",
      "API documentation"
    ]
  },
  {
    name: "E-commerce Platform",
    price: 35,
    includes: [
      "Product catalog",
      "Shopping cart",
      "Payment processing",
      "Order management",
      "Inventory tracking"
    ]
  }
];
```

### 3. Enterprise Templates

```typescript
const enterpriseTemplates = [
  {
    name: "Microservices Architecture",
    price: 100,
    includes: [
      "Service mesh configuration",
      "API gateway setup",
      "Distributed tracing",
      "CI/CD pipelines",
      "Kubernetes manifests"
    ]
  },
  {
    name: "ML Platform Template",
    price: 150,
    includes: [
      "Model training pipeline",
      "Feature store",
      "Model registry",
      "A/B testing framework",
      "Monitoring dashboards"
    ]
  }
];
```

## Template Customization

### 1. Configuration Options

```typescript
interface TemplateConfig {
  // Basic settings
  projectName: string;
  description: string;
  author: string;
  license: string;
  
  // Technical choices
  framework: Framework;
  language: Language;
  database?: Database;
  styling?: StylingOption;
  
  // Features
  features: {
    authentication?: AuthProvider;
    payments?: PaymentProvider;
    analytics?: AnalyticsProvider;
    email?: EmailProvider;
    storage?: StorageProvider;
  };
  
  // Advanced
  deployment?: {
    platform: DeploymentPlatform;
    region: string;
    environment: Environment;
  };
}
```

### 2. Dynamic File Generation

```typescript
class DynamicFileGenerator {
  generateComponent(config: ComponentConfig): string {
    const template = `
import React{{#if typescript}}, { FC }{{/if}} from 'react';
{{#if styling.tailwind}}
import { cn } from '@/lib/utils';
{{/if}}
{{#each imports}}
import {{ this.name }} from '{{ this.path }}';
{{/each}}

{{#if typescript}}
interface {{ componentName }}Props {
  {{#each props}}
  {{ this.name }}{{#if this.optional}}?{{/if}}: {{ this.type }};
  {{/each}}
}
{{/if}}

export {{#if typescript}}const{{else}}function{{/if}} {{ componentName }}{{#if typescript}}: FC<{{ componentName }}Props>{{/if}}({{ destructuredProps }}) {
  {{#if state}}
  {{#each state}}
  const [{{ this.name }}, set{{ capitalize this.name }}] = useState{{#if typescript}}<{{ this.type }}>{{/if}}({{ this.initial }});
  {{/each}}
  {{/if}}
  
  {{#if effects}}
  {{#each effects}}
  useEffect(() => {
    {{ this.body }}
  }, [{{ join this.dependencies }}]);
  {{/each}}
  {{/if}}
  
  return (
    <{{ rootElement }}{{#if className}} className="{{ className }}"{{/if}}>
      {{ children }}
    </{{ rootElement }}>
  );
}
`;
    
    return Handlebars.compile(template)(config);
  }
}
```

### 3. Smart Defaults

```typescript
class SmartDefaults {
  async inferDefaults(projectAnalysis: ProjectAnalysis): Promise<Partial<TemplateConfig>> {
    const defaults: Partial<TemplateConfig> = {};
    
    // Infer framework
    if (projectAnalysis.hasFile('package.json')) {
      const pkg = await this.readPackageJson();
      if (pkg.dependencies?.next) {
        defaults.framework = 'nextjs';
      } else if (pkg.dependencies?.react) {
        defaults.framework = 'react';
      }
    }
    
    // Infer database
    if (projectAnalysis.hasFile('prisma/schema.prisma')) {
      defaults.database = 'postgresql';
    }
    
    // Infer styling
    if (projectAnalysis.hasFile('tailwind.config.js')) {
      defaults.styling = 'tailwind';
    }
    
    return defaults;
  }
}
```

## Template Validation

### 1. Structure Validation

```typescript
class TemplateValidator {
  private schema = z.object({
    metadata: z.object({
      name: z.string().min(3).max(50),
      version: z.string().regex(/^\d+\.\d+\.\d+$/),
      author: z.string(),
      category: z.enum(['starter', 'professional', 'enterprise']),
      tags: z.array(z.string()).min(1).max(10)
    }),
    configuration: z.object({
      required: z.array(z.string()),
      optional: z.array(z.string())
    }),
    files: z.array(z.object({
      path: z.string(),
      template: z.string()
    }))
  });
  
  async validate(template: unknown): Promise<ValidationResult> {
    try {
      // Schema validation
      const parsed = this.schema.parse(template);
      
      // Template file validation
      await this.validateTemplateFiles(parsed);
      
      // Dependency validation
      await this.validateDependencies(parsed);
      
      // Security validation
      await this.validateSecurity(parsed);
      
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        errors: this.formatErrors(error)
      };
    }
  }
}
```

### 2. Quality Checks

```typescript
class TemplateQualityChecker {
  async assessQuality(template: Template): Promise<QualityReport> {
    const checks = {
      // Documentation
      hasReadme: await this.checkFile(template, 'README.md'),
      hasLicense: await this.checkFile(template, 'LICENSE'),
      hasExamples: await this.checkExamples(template),
      
      // Code quality
      hasTests: await this.checkTests(template),
      hasLinting: await this.checkLinting(template),
      hasTypeScript: await this.checkTypeScript(template),
      
      // Structure
      followsConventions: await this.checkConventions(template),
      hasGitignore: await this.checkFile(template, '.gitignore'),
      
      // Security
      noHardcodedSecrets: await this.checkSecrets(template),
      secureDependencies: await this.checkDependencies(template)
    };
    
    const score = this.calculateScore(checks);
    
    return {
      score,
      checks,
      recommendations: this.generateRecommendations(checks)
    };
  }
}
```

## Usage Examples

### 1. Using a Template

```typescript
// Find template
const templates = await templateEngine.search({
  category: 'starter',
  tags: ['nextjs', 'typescript'],
  priceMax: 10
});

// Configure template
const config = {
  projectName: 'my-saas-app',
  framework: 'nextjs',
  database: 'postgresql',
  features: {
    authentication: 'clerk',
    payments: 'stripe',
    analytics: 'plausible'
  }
};

// Process template
const result = await templateEngine.process(templates[0], config);

// Apply to project
await templateEngine.apply(result, './my-saas-app');
```

### 2. Creating a Template

```typescript
// Define template
const template = {
  metadata: {
    name: 'API Microservice',
    version: '1.0.0',
    author: '@myusername',
    category: 'professional',
    tags: ['api', 'microservice', 'docker']
  },
  files: [
    {
      path: 'src/server.ts',
      template: 'templates/server.ts.hbs'
    },
    {
      path: 'Dockerfile',
      template: 'templates/Dockerfile.hbs'
    }
  ]
};

// Register template
const templateId = await templateEngine.register(template);

// Publish to marketplace
await templateEngine.publish(templateId, {
  price: 15,
  description: 'Production-ready microservice template'
});
```

### 3. AI Template Generation

```typescript
// Generate custom template
const generated = await templateEngine.generateFromDescription(
  'I need a React component library template with Storybook, TypeScript, and automated publishing to NPM'
);

// Review and customize
const customized = await templateEngine.customize(generated, {
  additionalDependencies: ['@testing-library/react'],
  ciProvider: 'github-actions'
});

// Save as personal template
await templateEngine.savePersonal(customized, 'my-component-library');
```

## Performance Optimization

### 1. Template Caching

```typescript
class TemplateCache {
  private cache = new LRUCache<string, CompiledTemplate>({
    max: 100,
    ttl: 1000 * 60 * 60 // 1 hour
  });
  
  async getCompiled(templateId: string): Promise<CompiledTemplate> {
    const cached = this.cache.get(templateId);
    if (cached) return cached;
    
    const template = await this.loadTemplate(templateId);
    const compiled = await this.compileTemplate(template);
    
    this.cache.set(templateId, compiled);
    return compiled;
  }
}
```

### 2. Parallel Processing

```typescript
class ParallelTemplateProcessor {
  async processFiles(files: FileSpec[], config: Config): Promise<ProcessedFile[]> {
    // Process files in parallel batches
    const BATCH_SIZE = 10;
    const results: ProcessedFile[] = [];
    
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);
      const processed = await Promise.all(
        batch.map(file => this.processFile(file, config))
      );
      results.push(...processed);
    }
    
    return results;
  }
}
```

## Security Considerations

### 1. Template Sandboxing

```typescript
class TemplateSandbox {
  async executeInSandbox(template: Template, config: Config) {
    const sandbox = {
      // Limited globals
      process: {
        env: {} // No environment access
      },
      require: this.createSecureRequire(),
      
      // No file system access
      fs: undefined,
      child_process: undefined,
      
      // Safe utilities
      console: this.createSafeConsole(),
      JSON,
      Math,
      Date
    };
    
    return vm.runInNewContext(template.code, sandbox, {
      timeout: 5000,
      displayErrors: true
    });
  }
}
```

### 2. Input Sanitization

```typescript
class TemplateSanitizer {
  sanitizeConfig(config: any): TemplateConfig {
    // Remove potentially dangerous values
    const sanitized = { ...config };
    
    // Sanitize paths
    if (sanitized.projectName) {
      sanitized.projectName = this.sanitizePath(sanitized.projectName);
    }
    
    // Validate URLs
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string' && this.looksLikeUrl(sanitized[key])) {
        sanitized[key] = this.sanitizeUrl(sanitized[key]);
      }
    });
    
    return sanitized;
  }
}
```

## Related Documentation

- [Template Marketplace Model](../../template_marketplace_model.md)
- [Code Generation Service](code-generation.md)
- [API Generator](api-generator.md)
- [Pattern Learning](pattern-learning.md)

---

*Last Updated: 2024-01-20*