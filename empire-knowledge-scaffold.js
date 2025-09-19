#!/usr/bin/env node

/**
 * EMPIRE KNOWLEDGE SCAFFOLDING SYSTEM
 * Builds a real knowledge base from your codebase with reasoning differentials
 * Inspired by library automation systems like SAMS Sigma
 */

const fs = require('fs').promises;
const path = require('path');
const { Pool } = require('pg');
const Redis = require('redis');
const crypto = require('crypto');

class EmpireKnowledgeScaffold {
  constructor() {
    // Properly handle async Redis client
    this.redisClient = null;
    this.postgres = new Pool({
      host: 'localhost',
      port: 5432,
      database: 'document_generator',
      user: 'postgres',
      password: 'postgres'
    });
    
    // Knowledge layers (vortex pattern)
    this.knowledgeLayers = {
      surface: new Map(),      // File names and basic info
      semantic: new Map(),     // Meaning and relationships
      reasoning: new Map(),    // Decision patterns
      differential: new Map()  // Comparison insights
    };
    
    // Library automation patterns
    this.catalogSystem = {
      classifications: new Map(),
      crossReferences: new Map(),
      semanticIndex: new Map()
    };
  }
  
  async init() {
    console.log('🏛️ EMPIRE KNOWLEDGE SCAFFOLD INITIALIZING...\n');
    
    try {
      // Initialize Redis with new pattern
      this.redisClient = Redis.createClient({
        socket: {
          host: 'localhost',
          port: 6379
        }
      });
      
      await this.redisClient.connect();
      console.log('✅ Redis connected');
      
      // Test PostgreSQL
      const pgTest = await this.postgres.query('SELECT NOW()');
      console.log('✅ PostgreSQL connected:', pgTest.rows[0].now);
      
      // Initialize database schema
      await this.initializeKnowledgeSchema();
      
      // Start scaffolding
      await this.scaffoldEmpire();
      
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      throw error;
    }
  }
  
  async initializeKnowledgeSchema() {
    console.log('\n📚 Creating knowledge base schema...');
    
    const schema = `
      -- Knowledge graph nodes
      CREATE TABLE IF NOT EXISTS knowledge_nodes (
        id SERIAL PRIMARY KEY,
        node_type VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        path TEXT,
        content_hash VARCHAR(64),
        semantic_embedding JSONB,
        reasoning_patterns JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      -- Relationships between nodes
      CREATE TABLE IF NOT EXISTS knowledge_edges (
        id SERIAL PRIMARY KEY,
        source_id INTEGER REFERENCES knowledge_nodes(id),
        target_id INTEGER REFERENCES knowledge_nodes(id),
        relationship_type VARCHAR(50),
        strength FLOAT DEFAULT 1.0,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      -- Reasoning differentials
      CREATE TABLE IF NOT EXISTS reasoning_differentials (
        id SERIAL PRIMARY KEY,
        pattern_a JSONB NOT NULL,
        pattern_b JSONB NOT NULL,
        differential JSONB NOT NULL,
        insight TEXT,
        impact_score FLOAT,
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      -- Library catalog system
      CREATE TABLE IF NOT EXISTS empire_catalog (
        id SERIAL PRIMARY KEY,
        classification VARCHAR(100),
        subject_headings TEXT[],
        keywords TEXT[],
        file_path TEXT NOT NULL,
        abstract TEXT,
        cross_references INTEGER[],
        usage_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_nodes_type ON knowledge_nodes(node_type);
      CREATE INDEX IF NOT EXISTS idx_nodes_path ON knowledge_nodes(path);
      CREATE INDEX IF NOT EXISTS idx_edges_source ON knowledge_edges(source_id);
      CREATE INDEX IF NOT EXISTS idx_edges_target ON knowledge_edges(target_id);
      CREATE INDEX IF NOT EXISTS idx_catalog_classification ON empire_catalog(classification);
    `;
    
    await this.postgres.query(schema);
    console.log('✅ Knowledge schema initialized');
  }
  
  async scaffoldEmpire() {
    console.log('\n🔍 Scaffolding empire systems...');
    
    const baseDir = '/Users/matthewmauer/Desktop/Document-Generator';
    const files = await this.scanDirectory(baseDir);
    
    console.log(`\n📊 Found ${files.length} files to analyze`);
    
    // Phase 1: Surface layer - catalog everything
    console.log('\n📖 Phase 1: Building catalog...');
    for (const file of files) {
      if (file.endsWith('.js') || file.endsWith('.html') || file.endsWith('.md')) {
        await this.catalogFile(file);
      }
    }
    
    // Phase 2: Semantic layer - extract meaning
    console.log('\n🧠 Phase 2: Semantic analysis...');
    await this.buildSemanticLayer();
    
    // Phase 3: Reasoning layer - find patterns
    console.log('\n🎯 Phase 3: Reasoning pattern extraction...');
    await this.extractReasoningPatterns();
    
    // Phase 4: Differential layer - compare and learn
    console.log('\n⚡ Phase 4: Computing reasoning differentials...');
    await this.computeDifferentials();
    
    // Generate insights
    await this.generateInsights();
  }
  
  async scanDirectory(dir) {
    const files = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        const subFiles = await this.scanDirectory(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
    
    return files;
  }
  
  async catalogFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const name = path.basename(filePath);
      
      // Extract classification based on content and name
      const classification = this.classifyFile(name, content);
      
      // Extract keywords and subjects
      const keywords = this.extractKeywords(content);
      const subjects = this.extractSubjects(name, content);
      
      // Generate abstract
      const abstract = this.generateAbstract(content);
      
      // Store in catalog
      const result = await this.postgres.query(
        `INSERT INTO empire_catalog 
         (classification, subject_headings, keywords, file_path, abstract)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [classification, subjects, keywords, filePath, abstract]
      );
      
      // Also create knowledge node
      await this.postgres.query(
        `INSERT INTO knowledge_nodes
         (node_type, name, path, content_hash)
         VALUES ($1, $2, $3, $4)`,
        ['file', name, filePath, this.hashContent(content)]
      );
      
      // Cache in Redis for fast access
      await this.redisClient.hSet(
        'empire:catalog',
        filePath,
        JSON.stringify({ classification, keywords, subjects })
      );
      
    } catch (error) {
      // Skip files we can't read
    }
  }
  
  classifyFile(name, content) {
    const lowerName = name.toLowerCase();
    const lowerContent = content.toLowerCase();
    
    // Library of Congress style classification
    if (lowerName.includes('game') || lowerContent.includes('game')) return 'GV-Gaming';
    if (lowerName.includes('ai') || lowerContent.includes('artificial')) return 'Q-AI-Science';
    if (lowerName.includes('blockchain') || lowerContent.includes('crypto')) return 'HG-Finance-Crypto';
    if (lowerName.includes('audit') || lowerContent.includes('security')) return 'QA-Security';
    if (lowerName.includes('database') || lowerContent.includes('postgres')) return 'QA-Database';
    if (lowerName.includes('api') || lowerContent.includes('endpoint')) return 'TK-API-Technology';
    if (lowerName.includes('ui') || lowerName.includes('interface')) return 'T-UI-Technology';
    
    return 'Z-General';
  }
  
  extractKeywords(content) {
    const keywords = new Set();
    
    // Extract common programming patterns
    const patterns = [
      /class\s+(\w+)/g,
      /function\s+(\w+)/g,
      /const\s+(\w+)/g,
      /async\s+(\w+)/g,
      /export\s+(?:default\s+)?(?:class|function|const)\s+(\w+)/g
    ];
    
    for (const pattern of patterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].length > 3) {
          keywords.add(match[1].toLowerCase());
        }
      }
    }
    
    return Array.from(keywords).slice(0, 20);
  }
  
  extractSubjects(name, content) {
    const subjects = [];
    
    // Main subject from filename
    const mainSubject = name.replace(/[-_]/g, ' ').replace(/\.\w+$/, '');
    subjects.push(mainSubject);
    
    // Additional subjects from content patterns
    if (content.includes('express') || content.includes('server')) subjects.push('Web Server');
    if (content.includes('postgres') || content.includes('database')) subjects.push('Database');
    if (content.includes('redis')) subjects.push('Caching');
    if (content.includes('socket.io') || content.includes('websocket')) subjects.push('Real-time');
    if (content.includes('electron')) subjects.push('Desktop Application');
    
    return subjects;
  }
  
  generateAbstract(content) {
    // Simple abstract: first comment or first few lines
    const commentMatch = content.match(/\/\*\*[\s\S]*?\*\//);
    if (commentMatch) {
      return commentMatch[0].replace(/\/\*\*|\*\//g, '').trim();
    }
    
    const lines = content.split('\n').filter(l => l.trim());
    return lines.slice(0, 3).join(' ').substring(0, 200) + '...';
  }
  
  hashContent(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }
  
  async buildSemanticLayer() {
    // Analyze relationships between files
    const nodes = await this.postgres.query('SELECT * FROM knowledge_nodes WHERE node_type = $1', ['file']);
    
    for (const node of nodes.rows) {
      // Find imports/requires in each file
      if (node.path) {
        try {
          const content = await fs.readFile(node.path, 'utf8');
          const imports = this.extractImports(content);
          
          // Create edges for dependencies
          for (const imp of imports) {
            const targetNode = nodes.rows.find(n => n.path && n.path.includes(imp));
            if (targetNode) {
              await this.postgres.query(
                `INSERT INTO knowledge_edges (source_id, target_id, relationship_type, metadata)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT DO NOTHING`,
                [node.id, targetNode.id, 'imports', { module: imp }]
              );
            }
          }
        } catch (error) {
          // Skip unreadable files
        }
      }
    }
  }
  
  extractImports(content) {
    const imports = new Set();
    
    // CommonJS requires
    const requirePattern = /require\(['"]([^'"]+)['"]\)/g;
    const requireMatches = content.matchAll(requirePattern);
    for (const match of requireMatches) {
      imports.add(match[1]);
    }
    
    // ES6 imports
    const importPattern = /import\s+.*\s+from\s+['"]([^'"]+)['"]/g;
    const importMatches = content.matchAll(importPattern);
    for (const match of importMatches) {
      imports.add(match[1]);
    }
    
    return Array.from(imports);
  }
  
  async extractReasoningPatterns() {
    // Look for decision-making patterns in code
    const files = await this.postgres.query(
      `SELECT n.*, c.classification, c.keywords 
       FROM knowledge_nodes n
       JOIN empire_catalog c ON n.path = c.file_path
       WHERE n.node_type = 'file'`
    );
    
    for (const file of files.rows) {
      if (!file.path) continue;
      
      try {
        const content = await fs.readFile(file.path, 'utf8');
        const patterns = {
          conditionals: (content.match(/if\s*\(/g) || []).length,
          loops: (content.match(/for\s*\(|while\s*\(/g) || []).length,
          asyncPatterns: (content.match(/async|await|Promise/g) || []).length,
          errorHandling: (content.match(/try\s*\{|catch\s*\(/g) || []).length,
          stateManagement: (content.match(/state|setState|reducer/g) || []).length,
          dataFlow: this.analyzeDataFlow(content)
        };
        
        await this.postgres.query(
          `UPDATE knowledge_nodes 
           SET reasoning_patterns = $1
           WHERE id = $2`,
          [JSON.stringify(patterns), file.id]
        );
        
      } catch (error) {
        // Skip
      }
    }
  }
  
  analyzeDataFlow(content) {
    return {
      inputs: (content.match(/req\.|request\.|params\.|query\./g) || []).length,
      outputs: (content.match(/res\.|response\.|return|export/g) || []).length,
      transforms: (content.match(/map\(|filter\(|reduce\(|transform/g) || []).length,
      sideEffects: (content.match(/console\.|fs\.|database\.|api\./g) || []).length
    };
  }
  
  async computeDifferentials() {
    // Compare similar files to find reasoning differences
    const classifications = await this.postgres.query(
      `SELECT DISTINCT classification FROM empire_catalog`
    );
    
    for (const { classification } of classifications.rows) {
      const files = await this.postgres.query(
        `SELECT n.*, c.keywords
         FROM knowledge_nodes n
         JOIN empire_catalog c ON n.path = c.file_path
         WHERE c.classification = $1 AND n.reasoning_patterns IS NOT NULL
         LIMIT 10`,
        [classification]
      );
      
      // Compare pairs within same classification
      for (let i = 0; i < files.rows.length - 1; i++) {
        for (let j = i + 1; j < files.rows.length; j++) {
          const patternA = files.rows[i].reasoning_patterns;
          const patternB = files.rows[j].reasoning_patterns;
          
          const differential = this.computePatternDifferential(patternA, patternB);
          const insight = this.generateInsight(
            files.rows[i].name,
            files.rows[j].name,
            differential
          );
          
          await this.postgres.query(
            `INSERT INTO reasoning_differentials
             (pattern_a, pattern_b, differential, insight, impact_score)
             VALUES ($1, $2, $3, $4, $5)`,
            [patternA, patternB, differential, insight, differential.impactScore]
          );
        }
      }
    }
  }
  
  computePatternDifferential(patternA, patternB) {
    const diff = {};
    const allKeys = new Set([...Object.keys(patternA), ...Object.keys(patternB)]);
    
    for (const key of allKeys) {
      const valueA = patternA[key];
      const valueB = patternB[key];
      
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        diff[key] = {
          delta: valueB - valueA,
          ratio: valueA > 0 ? valueB / valueA : null,
          significant: Math.abs(valueB - valueA) > 10
        };
      } else if (typeof valueA === 'object' && typeof valueB === 'object') {
        diff[key] = this.computePatternDifferential(valueA || {}, valueB || {});
      }
    }
    
    // Calculate impact score
    let impactScore = 0;
    for (const value of Object.values(diff)) {
      if (value.significant) impactScore += 1;
      if (value.ratio && (value.ratio > 2 || value.ratio < 0.5)) impactScore += 2;
    }
    
    diff.impactScore = impactScore;
    return diff;
  }
  
  generateInsight(nameA, nameB, differential) {
    const insights = [];
    
    if (differential.conditionals?.significant) {
      insights.push(`${nameB} has ${differential.conditionals.delta > 0 ? 'more' : 'fewer'} conditional logic than ${nameA}`);
    }
    
    if (differential.errorHandling?.ratio > 2) {
      insights.push(`${nameB} has significantly more error handling`);
    }
    
    if (differential.asyncPatterns?.significant) {
      insights.push(`Different async patterns suggest different architectural approaches`);
    }
    
    return insights.join('. ') || 'Similar implementation patterns';
  }
  
  async generateInsights() {
    console.log('\n📊 KNOWLEDGE BASE INSIGHTS:\n');
    
    // Classification summary
    const classifications = await this.postgres.query(
      `SELECT classification, COUNT(*) as count
       FROM empire_catalog
       GROUP BY classification
       ORDER BY count DESC`
    );
    
    console.log('📚 Library Classification:');
    for (const { classification, count } of classifications.rows) {
      console.log(`   ${classification}: ${count} files`);
    }
    
    // Most connected nodes
    const hubs = await this.postgres.query(
      `SELECT n.name, n.path, COUNT(e.id) as connections
       FROM knowledge_nodes n
       LEFT JOIN knowledge_edges e ON n.id = e.source_id OR n.id = e.target_id
       GROUP BY n.id, n.name, n.path
       ORDER BY connections DESC
       LIMIT 5`
    );
    
    console.log('\n🔗 Most Connected Systems:');
    for (const { name, connections } of hubs.rows) {
      console.log(`   ${name}: ${connections} connections`);
    }
    
    // Reasoning insights
    const insights = await this.postgres.query(
      `SELECT insight, impact_score
       FROM reasoning_differentials
       ORDER BY impact_score DESC
       LIMIT 5`
    );
    
    console.log('\n💡 Top Reasoning Insights:');
    for (const { insight, impact_score } of insights.rows) {
      console.log(`   [Score: ${impact_score}] ${insight}`);
    }
    
    // Save summary to Redis
    const summary = {
      totalFiles: classifications.rows.reduce((sum, c) => sum + parseInt(c.count), 0),
      classifications: classifications.rows,
      topHubs: hubs.rows,
      insights: insights.rows
    };
    
    await this.redisClient.set('empire:knowledge:summary', JSON.stringify(summary));
    
    console.log('\n✅ Knowledge scaffold complete!');
    console.log('🔍 Access via Redis: empire:knowledge:summary');
    console.log('📊 Query PostgreSQL: knowledge_nodes, empire_catalog, reasoning_differentials');
  }
  
  async cleanup() {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
    await this.postgres.end();
  }
}

// Run the scaffold
const scaffold = new EmpireKnowledgeScaffold();

scaffold.init()
  .then(() => {
    console.log('\n🎯 Knowledge scaffolding complete!');
    return scaffold.cleanup();
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

module.exports = EmpireKnowledgeScaffold;