# Component Extraction Specification: Development Reality Engine
## Parsing Documentation to Extract Executable Components

**Version:** 1.0.0  
**Date:** 2025-08-12  
**Purpose:** Define how to extract component definitions from documentation

---

## Overview

This specification defines how the Development Reality Engine extracts executable component definitions from markdown documentation. It's the "parser" in our documentation compiler that transforms human-readable specs into machine-executable code.

## Extraction Patterns

### Pattern Recognition Engine
```javascript
class ComponentExtractor {
  constructor() {
    this.patterns = {
      // Class definitions
      classPattern: /class\s+(\w+)(?:\s+extends\s+(\w+))?\s*{([^}]+)}/g,
      
      // Function definitions
      functionPattern: /(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)\s*{([^}]+)}/g,
      
      // Interface definitions
      interfacePattern: /interface\s+(\w+)(?:\s+extends\s+(\w+))?\s*{([^}]+)}/g,
      
      // API endpoints
      apiPattern: /(GET|POST|PUT|DELETE|PATCH)\s+(\/[\w\/:]+)/g,
      
      // Data models
      modelPattern: /(?:type|interface)\s+(\w+)\s*=?\s*{([^}]+)}/g,
      
      // Configuration schemas
      configPattern: /const\s+(\w+Config)\s*=\s*{([^}]+)}/g,
      
      // Service definitions
      servicePattern: /export\s+(?:default\s+)?class\s+(\w+Service)/g
    };
  }
}
```

## Extraction Rules

### 1. Component Detection
```javascript
// Rule: Any code block with specific markers is a component
const componentMarkers = {
  classes: ['class', 'export class', 'abstract class'],
  functions: ['function', 'async function', 'export function'],
  services: ['Service', 'Controller', 'Handler', 'Manager'],
  models: ['interface', 'type', 'schema', 'model'],
  apis: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
};

// Example extraction from markdown
function extractComponents(markdown) {
  const ast = parseMarkdown(markdown);
  const components = [];
  
  // Visit all code blocks
  visit(ast, 'code', (node) => {
    const { lang, value } = node;
    
    // Check if it's a component definition
    if (isComponentDefinition(value)) {
      components.push({
        type: detectComponentType(value),
        name: extractComponentName(value),
        code: value,
        language: lang,
        location: node.position,
        context: extractSurroundingContext(ast, node)
      });
    }
  });
  
  return components;
}
```

### 2. Context Extraction
```javascript
// Extract surrounding documentation for context
function extractSurroundingContext(ast, codeNode) {
  const context = {
    description: '',
    requirements: [],
    examples: [],
    dependencies: [],
    configuration: {}
  };
  
  // Find preceding heading
  const heading = findPrecedingHeading(ast, codeNode);
  context.section = heading?.text;
  
  // Find preceding paragraph (description)
  const paragraph = findPrecedingParagraph(ast, codeNode);
  context.description = paragraph?.text;
  
  // Find bullet lists (requirements/features)
  const lists = findNearbyLists(ast, codeNode);
  lists.forEach(list => {
    if (list.ordered) {
      context.requirements.push(...list.items);
    } else {
      context.features = list.items;
    }
  });
  
  // Find following code blocks (examples)
  const examples = findFollowingCodeBlocks(ast, codeNode);
  context.examples = examples;
  
  return context;
}
```

### 3. Dependency Detection
```javascript
class DependencyExtractor {
  extract(component) {
    const dependencies = {
      imports: [],
      extends: null,
      implements: [],
      uses: [],
      requires: []
    };
    
    // Extract import statements
    const importPattern = /import\s+(?:{([^}]+)}|(\w+))\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    while (match = importPattern.exec(component.code)) {
      dependencies.imports.push({
        items: match[1] ? match[1].split(',').map(s => s.trim()) : [match[2]],
        from: match[3]
      });
    }
    
    // Extract class inheritance
    const extendsPattern = /class\s+\w+\s+extends\s+(\w+)/;
    const extendsMatch = component.code.match(extendsPattern);
    if (extendsMatch) {
      dependencies.extends = extendsMatch[1];
    }
    
    // Extract interface implementations
    const implementsPattern = /implements\s+([^{]+)/;
    const implementsMatch = component.code.match(implementsPattern);
    if (implementsMatch) {
      dependencies.implements = implementsMatch[1].split(',').map(s => s.trim());
    }
    
    // Extract used services/dependencies from constructor
    const constructorPattern = /constructor\s*\(([^)]+)\)/;
    const constructorMatch = component.code.match(constructorPattern);
    if (constructorMatch) {
      const params = constructorMatch[1].split(',');
      params.forEach(param => {
        const [name, type] = param.split(':').map(s => s.trim());
        if (type) {
          dependencies.uses.push({ name, type });
        }
      });
    }
    
    return dependencies;
  }
}
```

## Component Types

### 1. Service Components
```javascript
// Pattern: Classes ending with "Service"
const serviceExtractor = {
  pattern: /export\s+class\s+(\w+Service)\s+(?:extends\s+(\w+)\s+)?{([^}]+)}/g,
  
  extract(match) {
    const [full, name, baseClass, body] = match;
    
    return {
      type: 'service',
      name,
      extends: baseClass,
      methods: this.extractMethods(body),
      dependencies: this.extractDependencies(body),
      template: 'service.template.js'
    };
  },
  
  extractMethods(body) {
    const methods = [];
    const methodPattern = /(?:async\s+)?(\w+)\s*\(([^)]*)\)\s*(?::\s*([^{]+))?\s*{/g;
    
    let match;
    while (match = methodPattern.exec(body)) {
      methods.push({
        name: match[1],
        params: match[2].split(',').map(p => p.trim()),
        returnType: match[3]?.trim(),
        isAsync: match[0].includes('async')
      });
    }
    
    return methods;
  }
};
```

### 2. API Endpoint Components
```javascript
// Pattern: REST API definitions
const apiExtractor = {
  patterns: {
    route: /(GET|POST|PUT|DELETE|PATCH)\s+(\/\S+)/,
    handler: /(?:async\s+)?(?:function\s+)?(\w+)?\s*\((\w+),\s*(\w+)\)\s*(?:=>|{)/,
    middleware: /middleware:\s*\[([^\]]+)\]/
  },
  
  extract(section) {
    const endpoints = [];
    const lines = section.split('\n');
    
    let currentEndpoint = null;
    
    lines.forEach(line => {
      // Check for route definition
      const routeMatch = line.match(this.patterns.route);
      if (routeMatch) {
        if (currentEndpoint) endpoints.push(currentEndpoint);
        
        currentEndpoint = {
          method: routeMatch[1],
          path: routeMatch[2],
          params: this.extractPathParams(routeMatch[2]),
          query: [],
          body: null,
          response: null
        };
      }
      
      // Check for request/response schemas
      if (currentEndpoint) {
        if (line.includes('Request:')) {
          currentEndpoint.body = this.extractSchema(section, line);
        }
        if (line.includes('Response:')) {
          currentEndpoint.response = this.extractSchema(section, line);
        }
      }
    });
    
    if (currentEndpoint) endpoints.push(currentEndpoint);
    
    return endpoints;
  },
  
  extractPathParams(path) {
    const params = [];
    const paramPattern = /:(\w+)/g;
    
    let match;
    while (match = paramPattern.exec(path)) {
      params.push({
        name: match[1],
        in: 'path',
        required: true
      });
    }
    
    return params;
  }
};
```

### 3. Data Model Components
```javascript
// Pattern: TypeScript interfaces and types
const modelExtractor = {
  extract(code) {
    const models = [];
    
    // Extract interfaces
    const interfacePattern = /interface\s+(\w+)(?:\s+extends\s+([^{]+))?\s*{([^}]+)}/g;
    let match;
    
    while (match = interfacePattern.exec(code)) {
      const [full, name, extends_, body] = match;
      
      models.push({
        type: 'interface',
        name,
        extends: extends_?.split(',').map(e => e.trim()),
        properties: this.extractProperties(body),
        methods: this.extractMethods(body)
      });
    }
    
    // Extract types
    const typePattern = /type\s+(\w+)\s*=\s*({[^}]+}|[^;]+);/g;
    
    while (match = typePattern.exec(code)) {
      const [full, name, definition] = match;
      
      models.push({
        type: 'type',
        name,
        definition: definition.trim(),
        properties: definition.startsWith('{') ? 
          this.extractProperties(definition) : []
      });
    }
    
    return models;
  },
  
  extractProperties(body) {
    const properties = [];
    const propPattern = /(\w+)(\?)?\s*:\s*([^;,}]+)[;,]?/g;
    
    let match;
    while (match = propPattern.exec(body)) {
      properties.push({
        name: match[1],
        optional: !!match[2],
        type: match[3].trim(),
        description: this.findPropertyDescription(match[1], body)
      });
    }
    
    return properties;
  }
};
```

### 4. Configuration Components
```javascript
// Pattern: Configuration objects and schemas
const configExtractor = {
  extract(code, context) {
    const configs = [];
    
    // JSON configuration objects
    const jsonPattern = /const\s+(\w+Config)\s*=\s*({[\s\S]+?});/g;
    let match;
    
    while (match = jsonPattern.exec(code)) {
      const [full, name, json] = match;
      
      try {
        // Attempt to parse as JSON-like structure
        const config = this.parseConfigObject(json);
        
        configs.push({
          type: 'config',
          name,
          schema: this.generateSchema(config),
          defaults: config,
          validation: this.extractValidation(context)
        });
      } catch (e) {
        // Fallback to string representation
        configs.push({
          type: 'config',
          name,
          raw: json
        });
      }
    }
    
    return configs;
  },
  
  generateSchema(config) {
    const schema = {
      type: 'object',
      properties: {},
      required: []
    };
    
    Object.entries(config).forEach(([key, value]) => {
      schema.properties[key] = this.inferType(value);
      if (!key.endsWith('?')) {
        schema.required.push(key);
      }
    });
    
    return schema;
  }
};
```

## Advanced Extraction

### 1. Behavioral Specifications
```javascript
// Extract behavioral specifications from documentation
class BehaviorExtractor {
  extract(markdown) {
    const behaviors = [];
    
    // Find "should" statements (BDD style)
    const shouldPattern = /(?:it|should)\s+([^.]+)/g;
    let match;
    
    while (match = shouldPattern.exec(markdown)) {
      behaviors.push({
        description: match[1].trim(),
        type: 'requirement'
      });
    }
    
    // Find "MUST" requirements (RFC style)
    const mustPattern = /MUST\s+([^.]+)/g;
    
    while (match = mustPattern.exec(markdown)) {
      behaviors.push({
        description: match[1].trim(),
        type: 'mandatory',
        rfc2119: true
      });
    }
    
    // Find test scenarios
    const scenarioPattern = /(?:Scenario|Given|When|Then):\s*([^.]+)/g;
    
    while (match = scenarioPattern.exec(markdown)) {
      behaviors.push({
        description: match[1].trim(),
        type: 'scenario'
      });
    }
    
    return behaviors;
  }
}
```

### 2. Dependency Graph Building
```javascript
class DependencyGraphBuilder {
  build(components) {
    const graph = {
      nodes: new Map(),
      edges: []
    };
    
    // Create nodes
    components.forEach(component => {
      graph.nodes.set(component.name, {
        id: component.name,
        type: component.type,
        component
      });
    });
    
    // Create edges based on dependencies
    components.forEach(component => {
      const deps = component.dependencies;
      
      // Inheritance edges
      if (deps.extends) {
        graph.edges.push({
          from: component.name,
          to: deps.extends,
          type: 'extends'
        });
      }
      
      // Implementation edges
      deps.implements?.forEach(impl => {
        graph.edges.push({
          from: component.name,
          to: impl,
          type: 'implements'
        });
      });
      
      // Usage edges
      deps.uses?.forEach(use => {
        graph.edges.push({
          from: component.name,
          to: use.type,
          type: 'uses'
        });
      });
    });
    
    // Detect circular dependencies
    this.detectCycles(graph);
    
    // Calculate build order
    graph.buildOrder = this.topologicalSort(graph);
    
    return graph;
  }
}
```

### 3. Template Matching
```javascript
// Match extracted components to implementation templates
class TemplateMatcher {
  constructor() {
    this.templates = {
      service: {
        pattern: /Service$/,
        template: 'templates/service.js',
        generator: 'generateService'
      },
      controller: {
        pattern: /Controller$/,
        template: 'templates/controller.js',
        generator: 'generateController'
      },
      model: {
        pattern: /^I[A-Z]/,  // Interface naming convention
        template: 'templates/model.js',
        generator: 'generateModel'
      },
      repository: {
        pattern: /Repository$/,
        template: 'templates/repository.js',
        generator: 'generateRepository'
      }
    };
  }
  
  match(component) {
    // Find matching template based on naming patterns
    for (const [type, config] of Object.entries(this.templates)) {
      if (config.pattern.test(component.name)) {
        return {
          type,
          template: config.template,
          generator: config.generator
        };
      }
    }
    
    // Fallback to generic template
    return {
      type: 'generic',
      template: 'templates/generic.js',
      generator: 'generateGeneric'
    };
  }
}
```

## Extraction Pipeline

### Complete Extraction Flow
```javascript
class ExtractionPipeline {
  async extract(documentPath) {
    // 1. Load and parse document
    const content = await fs.readFile(documentPath, 'utf-8');
    const ast = markdownParser.parse(content);
    
    // 2. Extract all component types
    const components = {
      services: serviceExtractor.extract(ast),
      apis: apiExtractor.extract(ast),
      models: modelExtractor.extract(ast),
      configs: configExtractor.extract(ast),
      behaviors: behaviorExtractor.extract(ast)
    };
    
    // 3. Build dependency graph
    const allComponents = Object.values(components).flat();
    const dependencyGraph = dependencyGraphBuilder.build(allComponents);
    
    // 4. Match templates
    allComponents.forEach(component => {
      component.template = templateMatcher.match(component);
    });
    
    // 5. Validate extraction
    const validation = await this.validate(allComponents);
    
    // 6. Generate metadata
    const metadata = {
      source: documentPath,
      extractedAt: new Date().toISOString(),
      componentCount: allComponents.length,
      types: Object.entries(components).map(([type, items]) => ({
        type,
        count: items.length
      })),
      validation,
      dependencyGraph
    };
    
    return {
      components: allComponents,
      metadata
    };
  }
}
```

## Validation Rules

### Component Validation
```javascript
const validationRules = {
  // Names must follow conventions
  naming: {
    service: /^[A-Z][a-zA-Z]+Service$/,
    controller: /^[A-Z][a-zA-Z]+Controller$/,
    model: /^[A-Z][a-zA-Z]+$/,
    config: /^[a-z][a-zA-Z]+Config$/
  },
  
  // Required methods for each type
  requiredMethods: {
    service: ['initialize', 'shutdown'],
    controller: ['handle'],
    repository: ['find', 'save', 'delete']
  },
  
  // Required properties
  requiredProperties: {
    model: ['id'],
    config: ['version']
  }
};

function validateComponent(component) {
  const errors = [];
  
  // Validate naming
  const namingRule = validationRules.naming[component.type];
  if (namingRule && !namingRule.test(component.name)) {
    errors.push(`Invalid name: ${component.name} should match ${namingRule}`);
  }
  
  // Validate required methods
  const requiredMethods = validationRules.requiredMethods[component.type];
  if (requiredMethods) {
    const missingMethods = requiredMethods.filter(
      method => !component.methods?.find(m => m.name === method)
    );
    
    if (missingMethods.length > 0) {
      errors.push(`Missing required methods: ${missingMethods.join(', ')}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

## Output Format

### Extracted Component Structure
```json
{
  "components": [
    {
      "type": "service",
      "name": "VerificationService",
      "source": {
        "document": "SYSTEM-ARCHITECTURE.md",
        "section": "Verification Engine",
        "line": 245
      },
      "code": "class VerificationService extends BaseService { ... }",
      "methods": [
        {
          "name": "verify",
          "params": ["operation", "evidence"],
          "returnType": "Promise<VerificationResult>",
          "isAsync": true
        }
      ],
      "dependencies": {
        "extends": "BaseService",
        "imports": [
          { "items": ["EvidenceCollector"], "from": "./evidence" }
        ],
        "uses": [
          { "name": "logger", "type": "Logger" }
        ]
      },
      "template": {
        "type": "service",
        "path": "templates/service.js"
      },
      "validation": {
        "valid": true,
        "errors": []
      }
    }
  ],
  "metadata": {
    "source": "SYSTEM-ARCHITECTURE.md",
    "extractedAt": "2024-01-20T10:30:00Z",
    "componentCount": 15,
    "dependencyGraph": {
      "nodes": 15,
      "edges": 23,
      "cycles": 0,
      "buildOrder": ["BaseService", "Logger", "VerificationService", ...]
    }
  }
}
```

## Usage Example

### Extracting Components from Documentation
```javascript
const extractor = new ComponentExtractor();
const pipeline = new ExtractionPipeline();

// Extract from a single document
const result = await pipeline.extract('./SYSTEM-ARCHITECTURE.md');

console.log(`Extracted ${result.components.length} components`);

// Generate implementation files
for (const component of result.components) {
  const code = await codeGenerator.generate(component);
  const filePath = `./src/${component.type}s/${component.name}.js`;
  
  await fs.writeFile(filePath, code);
  console.log(`Generated ${filePath}`);
}

// Verify extraction
const verification = await verifier.verify(result.components);
console.log(`Verification: ${verification.passed ? 'PASSED' : 'FAILED'}`);
```

## Conclusion

The Component Extraction system transforms human-readable documentation into machine-parseable component definitions. It acts as the "eyes" of our documentation compiler, seeing structure where humans see text.

Key capabilities:
1. **Pattern Recognition**: Identifies components by structure and naming
2. **Context Preservation**: Maintains surrounding documentation
3. **Dependency Analysis**: Understands component relationships
4. **Validation**: Ensures extracted components are valid
5. **Template Matching**: Maps to implementation patterns

---

**"Give me well-structured documentation, and I shall extract a working system."**

*Component Extraction Specification v1.0 - Turning markdown into meaning.*