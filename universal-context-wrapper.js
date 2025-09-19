#!/usr/bin/env node

/**
 * UNIVERSAL CONTEXT WRAPPER ENGINE
 * Wraps all systems with proper context management
 * Not just tarballs - real connectivity
 */

const DatabaseContextEngine = require('./database-context-engine');
const ReasoningDifferentialEngine = require('./reasoning-differential-engine');
const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');

class UniversalContextWrapper extends EventEmitter {
  constructor() {
    super();
    
    this.contexts = new Map();
    this.wrappers = new Map();
    this.connections = new Map();
    
    // Core engines
    this.dbContext = null;
    this.reasoningEngine = null;
    
    this.initialize();
  }

  async initialize() {
    console.log(`
🌐 UNIVERSAL CONTEXT WRAPPER ENGINE 🌐
Proper context management across all systems
`);

    // Initialize core engines
    this.dbContext = new DatabaseContextEngine();
    this.reasoningEngine = new ReasoningDifferentialEngine();
    
    // Load existing contexts
    await this.loadContexts();
    
    // Build wrapper registry
    await this.buildWrapperRegistry();
    
    // Establish connections
    await this.establishConnections();
  }

  async loadContexts() {
    console.log('📚 Loading contexts...');
    
    // System contexts
    this.contexts.set('domains', {
      type: 'registry',
      source: 'DOMAIN-REGISTRY.json',
      loaded: true,
      data: await this.loadJSON('DOMAIN-REGISTRY.json')
    });
    
    this.contexts.set('services', {
      type: 'backend',
      source: 'backend-integration-service.js',
      loaded: true,
      data: {
        auth: { url: 'http://localhost:8463', name: 'OAuth Daemon' },
        tokenSystem: { url: 'http://localhost:7300', name: 'Token System' },
        verification: { url: 'http://localhost:7500', name: 'Verification Mempool' },
        networkService: { url: 'http://localhost:9001', name: 'Network Service' },
        serviceRegistry: { url: 'http://localhost:9002', name: 'Service Registry' },
        internetGateway: { url: 'http://localhost:9003', name: 'Internet Gateway' }
      }
    });
    
    this.contexts.set('learning-pipeline', {
      type: 'processing',
      source: 'unified-pipeline.js',
      loaded: true,
      data: {
        url: 'http://localhost:8000',
        stages: ['document-parsing', 'pattern-extraction', 'reasoning', 'differential', 'feedback']
      }
    });
    
    console.log(`✅ Loaded ${this.contexts.size} contexts`);
  }

  async loadJSON(filename) {
    try {
      const data = await fs.readFile(path.join(__dirname, filename), 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.warn(`Failed to load ${filename}:`, error.message);
      return null;
    }
  }

  async buildWrapperRegistry() {
    console.log('🎁 Building wrapper registry...');
    
    // Domain wrapper
    this.wrappers.set('domain-wrapper', {
      type: 'contextual',
      wrap: async (domain) => {
        const context = this.contexts.get('domains');
        const domainData = context?.data?.domains?.[domain];
        
        if (!domainData) {
          throw new Error(`Domain ${domain} not found in registry`);
        }
        
        return {
          domain,
          data: domainData,
          context: {
            zone: domainData.zone,
            routing: domainData.routing,
            connections: domainData.routing?.crossDomainPortals || [],
            services: await this.findDomainServices(domain)
          },
          operations: {
            navigate: (path) => this.navigateDomain(domain, path),
            connect: (target) => this.connectDomains(domain, target),
            query: (type) => this.queryDomain(domain, type)
          }
        };
      }
    });
    
    // Service wrapper
    this.wrappers.set('service-wrapper', {
      type: 'functional',
      wrap: async (service) => {
        const context = this.contexts.get('services');
        const serviceData = context?.data?.[service];
        
        if (!serviceData) {
          throw new Error(`Service ${service} not found`);
        }
        
        return {
          service,
          data: serviceData,
          context: {
            url: serviceData.url,
            port: this.extractPort(serviceData.url),
            connections: await this.findServiceConnections(service),
            dependencies: await this.findServiceDependencies(service)
          },
          operations: {
            call: (method, params) => this.callService(service, method, params),
            health: () => this.checkServiceHealth(service),
            connect: (target) => this.connectServices(service, target)
          }
        };
      }
    });
    
    // SQL wrapper
    this.wrappers.set('sql-wrapper', {
      type: 'data',
      wrap: async (schema) => {
        const schemaPath = this.findSchemaPath(schema);
        const content = await this.loadSchema(schemaPath);
        
        return {
          schema,
          path: schemaPath,
          content,
          context: {
            tables: this.extractTables(content),
            relationships: this.extractRelationships(content),
            indexes: this.extractIndexes(content)
          },
          operations: {
            query: (sql) => this.executeSQL(schema, sql),
            search: (pattern) => this.searchSchema(schema, pattern),
            graph: () => this.graphSchema(schema)
          }
        };
      }
    });
    
    // Learning wrapper
    this.wrappers.set('learning-wrapper', {
      type: 'pipeline',
      wrap: async (input) => {
        const pipeline = this.contexts.get('learning-pipeline');
        
        return {
          input,
          pipeline: pipeline.data,
          context: {
            type: this.detectInputType(input),
            complexity: await this.assessComplexity(input),
            patterns: await this.extractPatterns(input)
          },
          operations: {
            submit: () => this.submitToPipeline(input),
            process: () => this.processThroughDifferential(input),
            optimize: () => this.optimizeWithLearning(input)
          }
        };
      }
    });
    
    console.log(`✅ Built ${this.wrappers.size} wrappers`);
  }

  async establishConnections() {
    console.log('🔗 Establishing connections...');
    
    // Domain to service connections
    const domains = this.contexts.get('domains')?.data?.domains || {};
    for (const [domain, data] of Object.entries(domains)) {
      const backend = data.cloudflare_routing?.primary_backend;
      if (backend) {
        this.connections.set(`domain:${domain}`, `backend:${backend}`);
      }
    }
    
    // Service to service connections
    this.connections.set('service:auth', 'service:tokenSystem');
    this.connections.set('service:tokenSystem', 'service:verification');
    this.connections.set('service:networkService', 'service:serviceRegistry');
    
    // Pipeline connections
    this.connections.set('pipeline:input', 'service:dataProcessor');
    this.connections.set('service:reasoningEngine', 'pipeline:differential');
    
    console.log(`✅ Established ${this.connections.size} connections`);
  }

  // Wrapper operations
  async wrap(type, target) {
    const wrapper = this.wrappers.get(`${type}-wrapper`);
    if (!wrapper) {
      throw new Error(`No wrapper found for type: ${type}`);
    }
    
    return await wrapper.wrap(target);
  }

  async findDomainServices(domain) {
    const services = [];
    
    // Search through connections
    for (const [key, value] of this.connections.entries()) {
      if (key.startsWith(`domain:${domain}`)) {
        services.push(value);
      }
    }
    
    // Query database context
    if (this.dbContext) {
      const results = await this.dbContext.search(domain);
      results.forEach(r => {
        if (r.node?.type === 'service') {
          services.push(r.key);
        }
      });
    }
    
    return services;
  }

  async findServiceConnections(service) {
    const connections = [];
    
    for (const [key, value] of this.connections.entries()) {
      if (key === `service:${service}`) {
        connections.push(value);
      } else if (value === `service:${service}`) {
        connections.push(key);
      }
    }
    
    return connections;
  }

  async findServiceDependencies(service) {
    // Use reasoning engine to determine dependencies
    if (this.reasoningEngine) {
      const chain = await this.reasoningEngine.reasoningCore.createChain(
        { type: 'service', name: service },
        { type: 'dependencies', format: 'list' }
      );
      
      return chain.targetOutput;
    }
    
    return [];
  }

  extractPort(url) {
    const match = url.match(/:(\d+)/);
    return match ? parseInt(match[1]) : 80;
  }

  findSchemaPath(schema) {
    // Common schema locations
    const locations = [
      schema,
      `${schema}.sql`,
      `database/${schema}.sql`,
      `sql/${schema}.sql`,
      `schemas/${schema}.sql`
    ];
    
    for (const loc of locations) {
      const fullPath = path.join(__dirname, loc);
      if (require('fs').existsSync(fullPath)) {
        return fullPath;
      }
    }
    
    return schema; // Return as-is if not found
  }

  async loadSchema(schemaPath) {
    try {
      return await fs.readFile(schemaPath, 'utf8');
    } catch (error) {
      return null;
    }
  }

  extractTables(content) {
    if (!content) return [];
    
    const tables = [];
    const regex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/gi;
    
    let match;
    while ((match = regex.exec(content)) !== null) {
      tables.push(match[1]);
    }
    
    return tables;
  }

  extractRelationships(content) {
    if (!content) return [];
    
    const relationships = [];
    const fkRegex = /FOREIGN\s+KEY\s*\((\w+)\)\s*REFERENCES\s+(\w+)\s*\((\w+)\)/gi;
    
    let match;
    while ((match = fkRegex.exec(content)) !== null) {
      relationships.push({
        from: match[1],
        to: match[2],
        key: match[3]
      });
    }
    
    return relationships;
  }

  extractIndexes(content) {
    if (!content) return [];
    
    const indexes = [];
    const indexRegex = /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s+ON\s+(\w+)/gi;
    
    let match;
    while ((match = indexRegex.exec(content)) !== null) {
      indexes.push({
        name: match[1],
        table: match[2]
      });
    }
    
    return indexes;
  }

  detectInputType(input) {
    if (typeof input === 'string') {
      if (input.endsWith('.html')) return 'html';
      if (input.endsWith('.js')) return 'javascript';
      if (input.endsWith('.sql')) return 'sql';
      if (input.includes('domain:')) return 'domain';
      if (input.includes('service:')) return 'service';
    }
    return 'unknown';
  }

  async assessComplexity(input) {
    // Use reasoning engine for complexity assessment
    if (this.reasoningEngine) {
      const differential = this.reasoningEngine.differentialSystem.calculateDifferential(
        { type: 'simple', value: '' },
        { type: 'complex', value: input }
      );
      
      return differential.magnitude;
    }
    
    return 0.5; // Default medium complexity
  }

  async extractPatterns(input) {
    // Would integrate with enhanced research engine
    return [
      { type: 'structure', confidence: 0.8 },
      { type: 'behavior', confidence: 0.7 }
    ];
  }

  // Demo functionality
  async demo() {
    console.log('\n=== UNIVERSAL CONTEXT WRAPPER DEMO ===\n');
    
    // 1. Wrap a domain
    console.log('1️⃣ Wrapping domain: soulfra.com');
    const domainWrapper = await this.wrap('domain', 'soulfra.com');
    console.log(`  Zone: ${domainWrapper.context.zone.name}`);
    console.log(`  Connections: ${domainWrapper.context.connections.join(', ')}`);
    
    // 2. Wrap a service
    console.log('\n2️⃣ Wrapping service: auth');
    const serviceWrapper = await this.wrap('service', 'auth');
    console.log(`  URL: ${serviceWrapper.context.url}`);
    console.log(`  Connections: ${serviceWrapper.context.connections.join(', ')}`);
    
    // 3. Wrap SQL schema
    console.log('\n3️⃣ Wrapping SQL schema');
    try {
      const sqlWrapper = await this.wrap('sql', 'database-schema');
      console.log(`  Tables found: ${sqlWrapper.context.tables.length}`);
      console.log(`  First 3 tables: ${sqlWrapper.context.tables.slice(0, 3).join(', ')}`);
    } catch (error) {
      console.log(`  Schema wrapping demo skipped: ${error.message}`);
    }
    
    // 4. Wrap for learning pipeline
    console.log('\n4️⃣ Wrapping for learning pipeline');
    const learningWrapper = await this.wrap('learning', { 
      type: 'generated-site',
      path: './simple-site'
    });
    console.log(`  Input type: ${learningWrapper.context.type}`);
    console.log(`  Complexity: ${learningWrapper.context.complexity}`);
    console.log(`  Pipeline URL: ${learningWrapper.pipeline.url}`);
    
    console.log('\n✅ Context wrapper demo complete!');
  }
}

// CLI interface
async function cli() {
  const wrapper = new UniversalContextWrapper();
  await new Promise(resolve => setTimeout(resolve, 1500)); // Let initialization complete
  
  const command = process.argv[2];
  const args = process.argv.slice(3);
  
  switch (command) {
    case 'wrap':
      const type = args[0];
      const target = args[1];
      
      try {
        const wrapped = await wrapper.wrap(type, target);
        console.log('\nWrapped successfully:');
        console.log(JSON.stringify(wrapped, null, 2));
      } catch (error) {
        console.error('Wrap failed:', error.message);
      }
      break;
      
    case 'connect':
      const source = args[0];
      const dest = args[1];
      wrapper.connections.set(source, dest);
      console.log(`Connected: ${source} → ${dest}`);
      break;
      
    case 'list':
      const listType = args[0] || 'all';
      
      if (listType === 'contexts' || listType === 'all') {
        console.log('\nContexts:');
        wrapper.contexts.forEach((ctx, key) => {
          console.log(`  ${key}: ${ctx.type} (${ctx.source})`);
        });
      }
      
      if (listType === 'wrappers' || listType === 'all') {
        console.log('\nWrappers:');
        wrapper.wrappers.forEach((w, key) => {
          console.log(`  ${key}: ${w.type}`);
        });
      }
      
      if (listType === 'connections' || listType === 'all') {
        console.log('\nConnections:');
        wrapper.connections.forEach((dest, src) => {
          console.log(`  ${src} → ${dest}`);
        });
      }
      break;
      
    case 'demo':
      await wrapper.demo();
      break;
      
    default:
      console.log(`
Universal Context Wrapper

Usage:
  node universal-context-wrapper.js wrap <type> <target>  # Wrap with context
  node universal-context-wrapper.js connect <src> <dest>  # Create connection
  node universal-context-wrapper.js list [type]           # List contexts/wrappers/connections
  node universal-context-wrapper.js demo                  # Run demo

Wrapper Types:
  - domain: Wrap domains with full context
  - service: Wrap services with connections
  - sql: Wrap SQL schemas with structure
  - learning: Wrap for learning pipeline

Examples:
  node universal-context-wrapper.js wrap domain soulfra.com
  node universal-context-wrapper.js wrap service auth
  node universal-context-wrapper.js connect service:auth service:verification
`);
  }
  
  process.exit(0);
}

// Run CLI if called directly
if (require.main === module) {
  cli().catch(console.error);
}

module.exports = UniversalContextWrapper;