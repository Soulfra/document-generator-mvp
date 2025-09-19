#!/usr/bin/env node

/**
 * DATABASE CONTEXT ENGINE
 * Search, graph, and SQL through domains, registries, and schemas
 * Not just tarballs - proper context management
 */

const fs = require('fs').promises;
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { GraphDatabase } = require('neo4j-driver');

class DatabaseContextEngine {
  constructor() {
    this.domainRegistry = null;
    this.schemaDatabase = new sqlite3.Database(':memory:');
    this.contextGraph = new Map();
    this.searchIndex = new Map();
    
    this.initialize();
  }

  async initialize() {
    console.log(`
🧠 DATABASE CONTEXT ENGINE 🧠
Searching, graphing, and SQLing through your actual data
`);

    // Load domain registry
    await this.loadDomainRegistry();
    
    // Initialize schema database
    await this.initializeSchemaDB();
    
    // Build context graph
    await this.buildContextGraph();
    
    // Create search indexes
    await this.createSearchIndexes();
  }

  async loadDomainRegistry() {
    console.log('📊 Loading domain registry...');
    
    try {
      const registryPath = path.join(__dirname, 'DOMAIN-REGISTRY.json');
      const data = await fs.readFile(registryPath, 'utf8');
      this.domainRegistry = JSON.parse(data);
      
      console.log(`✅ Loaded ${Object.keys(this.domainRegistry.domains).length} domains`);
    } catch (error) {
      console.error('Failed to load domain registry:', error);
    }
  }

  async initializeSchemaDB() {
    console.log('🗄️ Initializing schema database...');
    
    return new Promise((resolve) => {
      this.schemaDatabase.serialize(() => {
        // Create context tracking tables
        this.schemaDatabase.run(`
          CREATE TABLE IF NOT EXISTS domains (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE,
            zone_type TEXT,
            backend_service TEXT,
            port INTEGER,
            features TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        this.schemaDatabase.run(`
          CREATE TABLE IF NOT EXISTS services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE,
            port INTEGER,
            domain_id INTEGER,
            type TEXT,
            status TEXT DEFAULT 'unknown',
            last_seen DATETIME,
            FOREIGN KEY(domain_id) REFERENCES domains(id)
          )
        `);

        this.schemaDatabase.run(`
          CREATE TABLE IF NOT EXISTS connections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_service_id INTEGER,
            target_service_id INTEGER,
            connection_type TEXT,
            protocol TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(source_service_id) REFERENCES services(id),
            FOREIGN KEY(target_service_id) REFERENCES services(id)
          )
        `);

        this.schemaDatabase.run(`
          CREATE TABLE IF NOT EXISTS schemas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_path TEXT UNIQUE,
            content TEXT,
            type TEXT,
            parsed_tables TEXT,
            dependencies TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        this.schemaDatabase.run(`
          CREATE TABLE IF NOT EXISTS context_links (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_type TEXT,
            source_id INTEGER,
            target_type TEXT,
            target_id INTEGER,
            relationship TEXT,
            metadata TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        console.log('✅ Schema database initialized');
        resolve();
      });
    });
  }

  async buildContextGraph() {
    console.log('🕸️ Building context graph...');
    
    // Add domains to graph
    if (this.domainRegistry) {
      for (const [domainName, domainData] of Object.entries(this.domainRegistry.domains)) {
        // Create domain node
        const domainNode = {
          type: 'domain',
          name: domainName,
          data: domainData,
          connections: new Set()
        };
        
        this.contextGraph.set(`domain:${domainName}`, domainNode);
        
        // Add to database
        await this.addDomainToDB(domainName, domainData);
        
        // Link cross-domain portals
        if (domainData.routing?.crossDomainPortals) {
          for (const portal of domainData.routing.crossDomainPortals) {
            domainNode.connections.add(`domain:${portal}`);
          }
        }
      }
    }
    
    // Load and parse SQL schemas
    await this.loadSQLSchemas();
    
    // Build service connections
    await this.buildServiceConnections();
    
    console.log(`✅ Context graph built: ${this.contextGraph.size} nodes`);
  }

  async addDomainToDB(name, data) {
    return new Promise((resolve) => {
      const stmt = this.schemaDatabase.prepare(`
        INSERT OR IGNORE INTO domains (name, zone_type, backend_service, port, features)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      const port = this.extractPort(data.cloudflare_routing?.primary_backend);
      const features = JSON.stringify(data.functionality?.features || []);
      
      stmt.run(
        name,
        data.zone?.type,
        data.cloudflare_routing?.primary_backend,
        port,
        features,
        resolve
      );
      
      stmt.finalize();
    });
  }

  extractPort(backend) {
    if (!backend) return null;
    const match = backend.match(/:(\d+)$/);
    return match ? parseInt(match[1]) : null;
  }

  async loadSQLSchemas() {
    console.log('📄 Loading SQL schemas...');
    
    // Find all SQL files
    const sqlFiles = await this.findSQLFiles();
    
    for (const sqlFile of sqlFiles) {
      try {
        const content = await fs.readFile(sqlFile, 'utf8');
        const parsed = this.parseSQL(content);
        
        // Add to database
        await this.addSchemaToDB(sqlFile, content, parsed);
        
        // Add to graph
        const schemaNode = {
          type: 'schema',
          path: sqlFile,
          tables: parsed.tables,
          connections: new Set()
        };
        
        this.contextGraph.set(`schema:${sqlFile}`, schemaNode);
        
      } catch (error) {
        console.warn(`Failed to load ${sqlFile}:`, error.message);
      }
    }
    
    console.log(`✅ Loaded ${sqlFiles.length} SQL schemas`);
  }

  async findSQLFiles() {
    // For now, return a subset of known schema files
    return [
      'database-schema.sql',
      'SOULFRA-DATABASE-SCHEMA.sql',
      'UNIFIED-GAME-WORLD-SCHEMA.sql',
      'AGENT-TO-AGENT-FORUM-PROTOCOL.sql',
      'cal-reasoning-schema.sql'
    ].map(f => path.join(__dirname, f));
  }

  parseSQL(content) {
    const tables = [];
    const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/gi;
    
    let match;
    while ((match = createTableRegex.exec(content)) !== null) {
      tables.push(match[1]);
    }
    
    return { tables };
  }

  async addSchemaToDB(filePath, content, parsed) {
    return new Promise((resolve) => {
      const stmt = this.schemaDatabase.prepare(`
        INSERT OR REPLACE INTO schemas (file_path, content, type, parsed_tables)
        VALUES (?, ?, ?, ?)
      `);
      
      stmt.run(
        filePath,
        content,
        'sql',
        JSON.stringify(parsed.tables),
        resolve
      );
      
      stmt.finalize();
    });
  }

  async buildServiceConnections() {
    console.log('🔗 Building service connections...');
    
    // Extract services from backend-integration-service.js config
    const services = {
      auth: { port: 8463, name: 'OAuth Daemon' },
      tokenSystem: { port: 7300, name: 'Token System' },
      verification: { port: 7500, name: 'Verification Mempool' },
      userAgent: { port: 8001, name: 'User Agent' },
      analytics: { port: 3002, name: 'Analytics' },
      contentAnalyzer: { port: 8002, name: 'Content Analyzer' },
      localRAG: { port: 8003, name: 'Local RAG' },
      ragOrchestrator: { port: 8004, name: 'RAG Orchestrator' },
      dataProcessor: { port: 8005, name: 'Data Processor' },
      modelTrainer: { port: 8006, name: 'Model Trainer' }
    };
    
    // Add services to database and graph
    for (const [key, service] of Object.entries(services)) {
      await this.addServiceToDB(key, service);
      
      const serviceNode = {
        type: 'service',
        key,
        ...service,
        connections: new Set()
      };
      
      this.contextGraph.set(`service:${key}`, serviceNode);
    }
    
    // Add known connections
    this.addConnection('service:auth', 'service:tokenSystem', 'auth-tokens');
    this.addConnection('service:tokenSystem', 'service:verification', 'token-verification');
    this.addConnection('service:analytics', 'service:contentAnalyzer', 'analytics-content');
    
    console.log('✅ Service connections built');
  }

  addConnection(source, target, type) {
    const sourceNode = this.contextGraph.get(source);
    const targetNode = this.contextGraph.get(target);
    
    if (sourceNode && targetNode) {
      sourceNode.connections.add(target);
      targetNode.connections.add(source);
    }
  }

  async addServiceToDB(key, service) {
    return new Promise((resolve) => {
      const stmt = this.schemaDatabase.prepare(`
        INSERT OR IGNORE INTO services (name, port, type, status)
        VALUES (?, ?, ?, ?)
      `);
      
      stmt.run(
        key,
        service.port,
        'backend',
        'configured',
        resolve
      );
      
      stmt.finalize();
    });
  }

  async createSearchIndexes() {
    console.log('🔍 Creating search indexes...');
    
    // Index domains
    for (const [key, node] of this.contextGraph.entries()) {
      if (node.type === 'domain') {
        this.indexNode(key, [
          node.name,
          node.data.zone?.name,
          node.data.zone?.description,
          ...(node.data.functionality?.features || [])
        ].join(' '));
      }
    }
    
    // Create SQL indexes
    await this.createSQLIndexes();
    
    console.log('✅ Search indexes created');
  }

  indexNode(key, text) {
    const words = text.toLowerCase().split(/\s+/);
    for (const word of words) {
      if (!this.searchIndex.has(word)) {
        this.searchIndex.set(word, new Set());
      }
      this.searchIndex.get(word).add(key);
    }
  }

  async createSQLIndexes() {
    return new Promise((resolve) => {
      this.schemaDatabase.serialize(() => {
        this.schemaDatabase.run('CREATE INDEX IF NOT EXISTS idx_domains_name ON domains(name)');
        this.schemaDatabase.run('CREATE INDEX IF NOT EXISTS idx_services_port ON services(port)');
        this.schemaDatabase.run('CREATE INDEX IF NOT EXISTS idx_connections_source ON connections(source_service_id)');
        this.schemaDatabase.run('CREATE INDEX IF NOT EXISTS idx_schemas_type ON schemas(type)');
        resolve();
      });
    });
  }

  // Query methods
  async search(query) {
    console.log(`\n🔍 Searching for: ${query}`);
    
    const words = query.toLowerCase().split(/\s+/);
    const results = new Set();
    
    // Search in index
    for (const word of words) {
      const matches = this.searchIndex.get(word);
      if (matches) {
        matches.forEach(m => results.add(m));
      }
    }
    
    // Search in SQL
    const sqlResults = await this.searchSQL(query);
    sqlResults.forEach(r => results.add(r));
    
    return Array.from(results).map(key => ({
      key,
      node: this.contextGraph.get(key)
    }));
  }

  async searchSQL(query) {
    return new Promise((resolve) => {
      const results = [];
      
      // Search domains
      this.schemaDatabase.all(
        `SELECT name FROM domains WHERE name LIKE ? OR zone_type LIKE ? OR features LIKE ?`,
        [`%${query}%`, `%${query}%`, `%${query}%`],
        (err, rows) => {
          if (!err && rows) {
            rows.forEach(row => results.push(`domain:${row.name}`));
          }
          
          // Search services
          this.schemaDatabase.all(
            `SELECT name FROM services WHERE name LIKE ?`,
            [`%${query}%`],
            (err, rows) => {
              if (!err && rows) {
                rows.forEach(row => results.push(`service:${row.name}`));
              }
              resolve(results);
            }
          );
        }
      );
    });
  }

  async graphTraversal(startNode, depth = 2) {
    console.log(`\n🕸️ Graph traversal from: ${startNode}`);
    
    const visited = new Set();
    const result = [];
    
    const traverse = (nodeKey, currentDepth) => {
      if (currentDepth > depth || visited.has(nodeKey)) return;
      
      visited.add(nodeKey);
      const node = this.contextGraph.get(nodeKey);
      
      if (node) {
        result.push({
          key: nodeKey,
          type: node.type,
          name: node.name || nodeKey,
          depth: currentDepth
        });
        
        // Traverse connections
        node.connections.forEach(conn => {
          traverse(conn, currentDepth + 1);
        });
      }
    };
    
    traverse(startNode, 0);
    return result;
  }

  async sqlQuery(query) {
    console.log(`\n🗄️ SQL Query: ${query}`);
    
    return new Promise((resolve, reject) => {
      this.schemaDatabase.all(query, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Demo functionality
  async demo() {
    console.log('\n=== DATABASE CONTEXT ENGINE DEMO ===\n');
    
    // 1. Search for ROI-related domains
    console.log('1️⃣ Searching for ROI-related content...');
    const roiResults = await this.search('roi prediction');
    roiResults.forEach(r => {
      console.log(`  Found: ${r.key} - ${r.node?.name || r.node?.data?.zone?.name}`);
    });
    
    // 2. Graph traversal from soulfra.com
    console.log('\n2️⃣ Graph traversal from soulfra.com...');
    const traversal = await this.graphTraversal('domain:soulfra.com');
    traversal.forEach(t => {
      console.log(`  ${'  '.repeat(t.depth)}→ ${t.name} (${t.type})`);
    });
    
    // 3. SQL query for services on specific ports
    console.log('\n3️⃣ SQL query for services...');
    const services = await this.sqlQuery('SELECT name, port FROM services WHERE port > 8000');
    services.forEach(s => {
      console.log(`  Service: ${s.name} on port ${s.port}`);
    });
    
    // 4. Find connections between services
    console.log('\n4️⃣ Finding service connections...');
    const authNode = this.contextGraph.get('service:auth');
    if (authNode) {
      console.log(`  Auth service connects to:`);
      authNode.connections.forEach(conn => {
        const target = this.contextGraph.get(conn);
        console.log(`    → ${target?.name || conn}`);
      });
    }
    
    console.log('\n✅ Demo complete!');
  }
}

// CLI interface
async function cli() {
  const engine = new DatabaseContextEngine();
  await new Promise(resolve => setTimeout(resolve, 1000)); // Let initialization complete
  
  const command = process.argv[2];
  const args = process.argv.slice(3);
  
  switch (command) {
    case 'search':
      const searchResults = await engine.search(args.join(' '));
      console.log(`\nFound ${searchResults.length} results:`);
      searchResults.forEach(r => {
        console.log(`- ${r.key}: ${r.node?.name || 'Unknown'}`);
      });
      break;
      
    case 'graph':
      const startNode = args[0] || 'domain:soulfra.com';
      const depth = parseInt(args[1]) || 2;
      const graphResults = await engine.graphTraversal(startNode, depth);
      console.log(`\nGraph traversal (depth ${depth}):`);
      graphResults.forEach(r => {
        console.log(`${'  '.repeat(r.depth)}→ ${r.name} (${r.type})`);
      });
      break;
      
    case 'sql':
      const query = args.join(' ');
      try {
        const sqlResults = await engine.sqlQuery(query);
        console.log(`\nQuery results (${sqlResults.length} rows):`);
        console.table(sqlResults);
      } catch (error) {
        console.error('SQL Error:', error.message);
      }
      break;
      
    case 'demo':
      await engine.demo();
      break;
      
    default:
      console.log(`
Database Context Engine

Usage:
  node database-context-engine.js search <query>     # Search domains and services
  node database-context-engine.js graph <node> <depth>  # Traverse connections
  node database-context-engine.js sql <query>        # Execute SQL query
  node database-context-engine.js demo               # Run demo

Examples:
  node database-context-engine.js search "roi prediction"
  node database-context-engine.js graph "domain:soulfra.com" 3
  node database-context-engine.js sql "SELECT * FROM services WHERE port > 8000"
`);
  }
  
  process.exit(0);
}

// Run CLI if called directly
if (require.main === module) {
  cli().catch(console.error);
}

module.exports = DatabaseContextEngine;