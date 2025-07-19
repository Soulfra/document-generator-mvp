/**
 * Architect Agent - Designs system architecture from requirements
 */

class ArchitectAgent {
  constructor(id, reasoningEngine) {
    this.id = id;
    this.reasoningEngine = reasoningEngine;
    this.architecturePatterns = new Map();
    this.setupArchitecturePatterns();
    console.log(`🏗️ ArchitectAgent ${id} initialized`);
  }

  setupArchitecturePatterns() {
    this.architecturePatterns.set('web_application', {
      frontend: ['React', 'Vue', 'Angular'],
      backend: ['Node.js/Express', 'Python/FastAPI', 'Go/Gin'],
      database: ['PostgreSQL', 'MongoDB', 'Redis'],
      deployment: ['Docker', 'Kubernetes', 'Vercel']
    });

    this.architecturePatterns.set('api_service', {
      framework: ['Express', 'FastAPI', 'Spring Boot'],
      database: ['PostgreSQL', 'MySQL', 'MongoDB'],
      caching: ['Redis', 'Memcached'],
      deployment: ['Docker', 'AWS Lambda', 'Google Cloud Run']
    });

    this.architecturePatterns.set('mobile_app', {
      framework: ['React Native', 'Flutter', 'Native'],
      backend: ['Node.js', 'Python', 'Go'],
      database: ['Firebase', 'AWS DynamoDB', 'PostgreSQL'],
      deployment: ['App Store', 'Play Store', 'TestFlight']
    });
  }

  async designArchitecture(requirements, options = {}) {
    console.log(`🏗️ Designing architecture for ${requirements.features?.length || 0} features`);

    // Start reasoning session
    const session = await this.reasoningEngine.startReasoningSession({
      type: 'architecture_design',
      context: { 
        requirements, 
        constraints: requirements.constraints || [],
        targetPlatform: options.targetPlatform || 'web'
      }
    });

    // Analyze requirements and determine architecture type
    const architectureType = this.determineArchitectureType(requirements);
    console.log(`🏗️ Architecture type: ${architectureType}`);

    // Design system components
    const systemDesign = await this.designSystemComponents(requirements, architectureType, session);

    // Design database schema
    const databaseDesign = await this.designDatabaseSchema(requirements, session);

    // Design API structure
    const apiDesign = await this.designAPIStructure(requirements, session);

    // Select technology stack
    const techStack = this.selectTechnologyStack(requirements, architectureType);

    // Create deployment strategy
    const deploymentStrategy = this.createDeploymentStrategy(requirements, techStack);

    await this.reasoningEngine.completeSession(session.id);

    return {
      architecture: {
        type: architectureType,
        components: systemDesign,
        database: databaseDesign,
        api: apiDesign,
        technology: techStack,
        deployment: deploymentStrategy
      },
      reasoning: session.id,
      confidence: this.calculateArchitectureConfidence(requirements, systemDesign)
    };
  }

  determineArchitectureType(requirements) {
    const features = requirements.features || [];
    const technicalReqs = requirements.technicalRequirements || [];

    // Check for mobile indicators
    const mobileKeywords = ['mobile', 'ios', 'android', 'app store'];
    if (this.hasKeywords(features.concat(technicalReqs), mobileKeywords)) {
      return 'mobile_app';
    }

    // Check for API-only indicators
    const apiKeywords = ['api', 'endpoints', 'microservice', 'rest', 'graphql'];
    if (this.hasKeywords(technicalReqs, apiKeywords)) {
      return 'api_service';
    }

    // Default to web application
    return 'web_application';
  }

  async designSystemComponents(requirements, architectureType, session) {
    const features = requirements.features || [];
    const components = [];

    // Core components based on features
    for (const feature of features) {
      const component = await this.designComponentForFeature(feature, architectureType);
      components.push(component);
    }

    // Add infrastructure components
    components.push(
      { name: 'Authentication', type: 'service', responsibility: 'User auth and authorization' },
      { name: 'Database', type: 'data', responsibility: 'Data persistence and queries' },
      { name: 'API Gateway', type: 'infrastructure', responsibility: 'Request routing and validation' },
      { name: 'Monitoring', type: 'infrastructure', responsibility: 'System health and metrics' }
    );

    return components;
  }

  async designComponentForFeature(feature, architectureType) {
    const componentTypes = {
      'web_application': {
        prefix: 'Component',
        type: 'ui_component'
      },
      'api_service': {
        prefix: 'Service',
        type: 'service'
      },
      'mobile_app': {
        prefix: 'Screen',
        type: 'screen'
      }
    };

    const config = componentTypes[architectureType] || componentTypes['web_application'];

    return {
      name: `${feature.name}${config.prefix}`,
      type: config.type,
      responsibility: feature.description,
      dependencies: this.identifyDependencies(feature),
      apis: this.extractAPIsFromFeature(feature)
    };
  }

  async designDatabaseSchema(requirements, session) {
    const features = requirements.features || [];
    const entities = [];
    const relationships = [];

    // Extract entities from features
    for (const feature of features) {
      const entityNames = this.extractEntitiesFromFeature(feature);
      for (const entityName of entityNames) {
        if (!entities.find(e => e.name === entityName)) {
          entities.push({
            name: entityName,
            fields: this.generateFieldsForEntity(entityName, feature),
            indexes: this.suggestIndexes(entityName)
          });
        }
      }
    }

    // Add standard entities
    entities.push(
      {
        name: 'User',
        fields: [
          { name: 'id', type: 'UUID', primary: true },
          { name: 'email', type: 'String', unique: true },
          { name: 'passwordHash', type: 'String' },
          { name: 'createdAt', type: 'DateTime' },
          { name: 'updatedAt', type: 'DateTime' }
        ],
        indexes: ['email']
      }
    );

    return {
      entities,
      relationships,
      migrations: this.generateMigrations(entities)
    };
  }

  async designAPIStructure(requirements, session) {
    const features = requirements.features || [];
    const endpoints = [];

    // Generate CRUD endpoints for each feature
    for (const feature of features) {
      const resourceName = this.extractResourceName(feature);
      if (resourceName) {
        endpoints.push(
          { method: 'GET', path: `/${resourceName}`, description: `List ${resourceName}` },
          { method: 'POST', path: `/${resourceName}`, description: `Create ${resourceName}` },
          { method: 'GET', path: `/${resourceName}/:id`, description: `Get ${resourceName} by ID` },
          { method: 'PUT', path: `/${resourceName}/:id`, description: `Update ${resourceName}` },
          { method: 'DELETE', path: `/${resourceName}/:id`, description: `Delete ${resourceName}` }
        );
      }
    }

    // Add auth endpoints
    endpoints.push(
      { method: 'POST', path: '/auth/login', description: 'User login' },
      { method: 'POST', path: '/auth/register', description: 'User registration' },
      { method: 'POST', path: '/auth/logout', description: 'User logout' },
      { method: 'POST', path: '/auth/refresh', description: 'Refresh token' }
    );

    return {
      baseUrl: '/api/v1',
      endpoints,
      authentication: 'JWT Bearer Token',
      documentation: 'OpenAPI 3.0'
    };
  }

  selectTechnologyStack(requirements, architectureType) {
    const constraints = requirements.constraints || [];
    const pattern = this.architecturePatterns.get(architectureType);

    // Consider constraints when selecting technologies
    const budget = this.findConstraint(constraints, 'budget');
    const timeline = this.findConstraint(constraints, 'timeline');
    const performance = this.findConstraint(constraints, 'performance');

    return {
      frontend: this.selectFrontendTech(pattern, constraints),
      backend: this.selectBackendTech(pattern, constraints),
      database: this.selectDatabaseTech(pattern, constraints),
      deployment: this.selectDeploymentTech(pattern, constraints),
      monitoring: ['Prometheus', 'Grafana'],
      testing: ['Jest', 'Cypress'],
      ci_cd: ['GitHub Actions', 'Docker']
    };
  }

  createDeploymentStrategy(requirements, techStack) {
    const constraints = requirements.constraints || [];
    const performanceConstraint = this.findConstraint(constraints, 'performance');

    return {
      environment: 'containerized',
      platform: 'Kubernetes',
      scaling: performanceConstraint ? 'horizontal' : 'vertical',
      monitoring: 'Prometheus + Grafana',
      logging: 'ELK Stack',
      backup: 'automated daily',
      security: ['HTTPS', 'WAF', 'Rate Limiting'],
      stages: ['development', 'staging', 'production']
    };
  }

  // Helper methods

  hasKeywords(items, keywords) {
    const text = items.map(item => 
      typeof item === 'string' ? item : item.description || item.name || ''
    ).join(' ').toLowerCase();
    
    return keywords.some(keyword => text.includes(keyword));
  }

  identifyDependencies(feature) {
    const deps = [];
    const desc = feature.description.toLowerCase();
    
    if (desc.includes('user') || desc.includes('auth')) deps.push('Authentication');
    if (desc.includes('data') || desc.includes('store')) deps.push('Database');
    if (desc.includes('api') || desc.includes('request')) deps.push('API Gateway');
    
    return deps;
  }

  extractAPIsFromFeature(feature) {
    const apis = [];
    const name = feature.name.toLowerCase().replace(/\s+/g, '-');
    
    apis.push(`GET /${name}`);
    apis.push(`POST /${name}`);
    
    return apis;
  }

  extractEntitiesFromFeature(feature) {
    const entities = [];
    const words = feature.name.split(' ');
    
    // Look for noun-like words that could be entities
    const entityCandidates = words.filter(word => 
      word.length > 3 && 
      !['the', 'and', 'for', 'with', 'can', 'will'].includes(word.toLowerCase())
    );
    
    entities.push(...entityCandidates.map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ));
    
    return [...new Set(entities)];
  }

  generateFieldsForEntity(entityName, feature) {
    const baseFields = [
      { name: 'id', type: 'UUID', primary: true },
      { name: 'createdAt', type: 'DateTime' },
      { name: 'updatedAt', type: 'DateTime' }
    ];

    // Add entity-specific fields
    const specificFields = [];
    if (entityName.toLowerCase().includes('user')) {
      specificFields.push({ name: 'email', type: 'String' });
    }
    if (entityName.toLowerCase().includes('product')) {
      specificFields.push({ name: 'name', type: 'String' });
      specificFields.push({ name: 'price', type: 'Decimal' });
    }

    return [...baseFields, ...specificFields];
  }

  suggestIndexes(entityName) {
    const indexes = ['id'];
    if (entityName.toLowerCase().includes('user')) {
      indexes.push('email');
    }
    return indexes;
  }

  generateMigrations(entities) {
    return entities.map((entity, index) => ({
      version: `001_create_${entity.name.toLowerCase()}_table`,
      sql: `CREATE TABLE ${entity.name.toLowerCase()}s (${entity.fields.map(f => 
        `${f.name} ${f.type}${f.primary ? ' PRIMARY KEY' : ''}${f.unique ? ' UNIQUE' : ''}`
      ).join(', ')});`
    }));
  }

  extractResourceName(feature) {
    const words = feature.name.toLowerCase().split(' ');
    return words.find(word => word.length > 3) || null;
  }

  findConstraint(constraints, type) {
    return constraints.find(c => c.type === type);
  }

  selectFrontendTech(pattern, constraints) {
    const timeline = this.findConstraint(constraints, 'timeline');
    
    if (timeline && timeline.description.includes('fast')) {
      return 'React'; // Fastest to develop with
    }
    
    return pattern.frontend[0]; // Default to first option
  }

  selectBackendTech(pattern, constraints) {
    const performance = this.findConstraint(constraints, 'performance');
    
    if (performance && performance.impact === 'high') {
      return 'Go/Gin'; // High performance
    }
    
    return pattern.backend[0]; // Default
  }

  selectDatabaseTech(pattern, constraints) {
    const performance = this.findConstraint(constraints, 'performance');
    
    if (performance && performance.description.includes('concurrent')) {
      return 'PostgreSQL'; // Good for high concurrency
    }
    
    return pattern.database[0]; // Default
  }

  selectDeploymentTech(pattern, constraints) {
    const budget = this.findConstraint(constraints, 'budget');
    
    if (budget && budget.description.includes('low')) {
      return 'Docker'; // Cost-effective
    }
    
    return pattern.deployment[0]; // Default
  }

  calculateArchitectureConfidence(requirements, systemDesign) {
    let score = 0.7; // Base confidence
    
    // Increase confidence based on requirement clarity
    if (requirements.features && requirements.features.length > 0) score += 0.1;
    if (requirements.technicalRequirements && requirements.technicalRequirements.length > 0) score += 0.1;
    if (requirements.constraints && requirements.constraints.length > 0) score += 0.1;
    
    return Math.min(0.95, score);
  }
}

module.exports = ArchitectAgent;