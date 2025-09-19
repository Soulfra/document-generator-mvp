#!/usr/bin/env node
// Database Initialization Script
// Sets up MySQL/PostgreSQL database for Economic Engine

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

class DatabaseInitializer {
  constructor() {
    this.config = {
      mysql: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true
      },
      postgres: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: 'postgres'
      }
    };
    
    this.dbType = process.env.DB_TYPE || 'mysql';
  }

  async init() {
    console.log('🗄️ Database Initialization Starting...');
    console.log(`📊 Database Type: ${this.dbType}`);
    console.log('');
    
    try {
      if (this.dbType === 'mysql') {
        await this.initMySQL();
      } else if (this.dbType === 'postgres') {
        await this.initPostgreSQL();
      } else {
        throw new Error(`Unsupported database type: ${this.dbType}`);
      }
      
      console.log('');
      console.log('✅ Database initialization completed successfully!');
      
    } catch (error) {
      console.error('❌ Database initialization failed:', error.message);
      process.exit(1);
    }
  }

  async initMySQL() {
    let connection;
    
    try {
      // Connect to MySQL server
      console.log('🔗 Connecting to MySQL...');
      connection = await mysql.createConnection(this.config.mysql);
      console.log('✅ Connected to MySQL');
      
      // Create database if not exists
      console.log('📁 Creating database...');
      await connection.query('CREATE DATABASE IF NOT EXISTS economic_engine');
      await connection.query('USE economic_engine');
      console.log('✅ Database created/selected');
      
      // Read and execute schema
      console.log('📋 Loading schema...');
      const schema = fs.readFileSync(path.join(__dirname, 'database-setup.sql'), 'utf8');
      
      // Split by delimiter to handle stored procedures
      const statements = this.splitSQLStatements(schema);
      
      // Execute each statement
      console.log(`🔨 Executing ${statements.length} SQL statements...`);
      let completed = 0;
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await connection.query(statement);
            completed++;
            if (completed % 10 === 0) {
              console.log(`  ✓ Completed ${completed}/${statements.length} statements`);
            }
          } catch (error) {
            console.error(`  ❌ Failed statement: ${statement.substring(0, 50)}...`);
            console.error(`     Error: ${error.message}`);
          }
        }
      }
      
      console.log(`✅ Schema loaded (${completed} statements executed)`);
      
      // Verify tables
      await this.verifyTables(connection);
      
    } finally {
      if (connection) {
        await connection.end();
        console.log('🔌 Database connection closed');
      }
    }
  }

  async initPostgreSQL() {
    const { Client } = require('pg');
    
    // First connect to create database
    const client = new Client(this.config.postgres);
    
    try {
      console.log('🔗 Connecting to PostgreSQL...');
      await client.connect();
      console.log('✅ Connected to PostgreSQL');
      
      // Check if database exists
      const dbCheck = await client.query(
        "SELECT 1 FROM pg_database WHERE datname = 'economic_engine'"
      );
      
      if (dbCheck.rows.length === 0) {
        console.log('📁 Creating database...');
        await client.query('CREATE DATABASE economic_engine');
        console.log('✅ Database created');
      }
      
      await client.end();
      
      // Connect to the economic_engine database
      const dbClient = new Client({
        ...this.config.postgres,
        database: 'economic_engine'
      });
      
      await dbClient.connect();
      
      // Convert MySQL schema to PostgreSQL
      console.log('📋 Converting schema to PostgreSQL...');
      const mysqlSchema = fs.readFileSync(path.join(__dirname, 'database-setup.sql'), 'utf8');
      const pgSchema = this.convertToPostgreSQL(mysqlSchema);
      
      // Execute schema
      console.log('🔨 Executing schema...');
      const statements = pgSchema.split(';').filter(s => s.trim());
      
      let completed = 0;
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await dbClient.query(statement);
            completed++;
          } catch (error) {
            console.error(`  ❌ Failed: ${statement.substring(0, 50)}...`);
            console.error(`     Error: ${error.message}`);
          }
        }
      }
      
      console.log(`✅ Schema loaded (${completed} statements executed)`);
      
      await dbClient.end();
      
    } catch (error) {
      throw error;
    }
  }

  splitSQLStatements(sql) {
    // Handle DELIMITER changes for stored procedures
    const statements = [];
    let current = '';
    let inDelimiter = false;
    let delimiter = ';';
    
    const lines = sql.split('\n');
    
    for (const line of lines) {
      if (line.trim().startsWith('DELIMITER')) {
        const match = line.match(/DELIMITER\s+(\S+)/);
        if (match) {
          delimiter = match[1];
          inDelimiter = delimiter !== ';';
        }
        continue;
      }
      
      current += line + '\n';
      
      if (line.trim().endsWith(delimiter)) {
        statements.push(current.replace(new RegExp(delimiter + '$'), ''));
        current = '';
      }
    }
    
    if (current.trim()) {
      statements.push(current);
    }
    
    return statements;
  }

  convertToPostgreSQL(mysqlSchema) {
    let pgSchema = mysqlSchema;
    
    // Basic conversions
    pgSchema = pgSchema.replace(/AUTO_INCREMENT/gi, '');
    pgSchema = pgSchema.replace(/INT\s+PRIMARY KEY/gi, 'SERIAL PRIMARY KEY');
    pgSchema = pgSchema.replace(/\bINT\b/gi, 'INTEGER');
    pgSchema = pgSchema.replace(/\bTINYINT\(1\)/gi, 'BOOLEAN');
    pgSchema = pgSchema.replace(/\bDATETIME\b/gi, 'TIMESTAMP');
    pgSchema = pgSchema.replace(/\bTINYTEXT\b/gi, 'TEXT');
    pgSchema = pgSchema.replace(/\bMEDIUMTEXT\b/gi, 'TEXT');
    pgSchema = pgSchema.replace(/\bLONGTEXT\b/gi, 'TEXT');
    pgSchema = pgSchema.replace(/\bDOUBLE\b/gi, 'DOUBLE PRECISION');
    pgSchema = pgSchema.replace(/\bFLOAT\b/gi, 'REAL');
    
    // Remove MySQL-specific syntax
    pgSchema = pgSchema.replace(/\sON UPDATE CURRENT_TIMESTAMP/gi, '');
    pgSchema = pgSchema.replace(/\sENGINE\s*=\s*\w+/gi, '');
    pgSchema = pgSchema.replace(/\sDEFAULT CHARSET\s*=\s*\w+/gi, '');
    pgSchema = pgSchema.replace(/\sCOLLATE\s*=\s*\w+/gi, '');
    pgSchema = pgSchema.replace(/\sUSING BTREE/gi, '');
    
    // Convert ON DUPLICATE KEY UPDATE to PostgreSQL ON CONFLICT
    pgSchema = pgSchema.replace(
      /ON DUPLICATE KEY UPDATE (\w+)\s*=\s*\1/gi,
      'ON CONFLICT ($1) DO UPDATE SET $1 = EXCLUDED.$1'
    );
    
    // Remove stored procedures (PostgreSQL syntax is different)
    pgSchema = pgSchema.replace(/DELIMITER\s+\/\/[\s\S]*?DELIMITER\s+;/gi, '');
    
    // Remove USE statement
    pgSchema = pgSchema.replace(/USE\s+\w+;/gi, '');
    
    // Fix INDEX syntax
    pgSchema = pgSchema.replace(/INDEX\s+(\w+)\s*\(([^)]+)\)/gi, 'CREATE INDEX $1 ON {table} ($2)');
    
    return pgSchema;
  }

  async verifyTables(connection) {
    console.log('');
    console.log('🔍 Verifying database structure...');
    
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`✅ Created ${tables.length} tables`);
    
    // Check key tables
    const keyTables = [
      'users',
      'sessions',
      'ai_agents',
      'agent_trades',
      'api_usage',
      'documents',
      'processing_jobs',
      'flags',
      'tags'
    ];
    
    for (const table of keyTables) {
      const exists = tables.some(t => Object.values(t)[0] === table);
      console.log(`  ${exists ? '✅' : '❌'} ${table}`);
    }
    
    // Check initial data
    const [agents] = await connection.query('SELECT COUNT(*) as count FROM ai_agents');
    console.log(`\n✅ Initialized ${agents[0].count} AI agents`);
    
    const [flags] = await connection.query('SELECT COUNT(*) as count FROM flags');
    console.log(`✅ Initialized ${flags[0].count} system flags`);
  }
}

// Create .env.example if it doesn't exist
function createEnvExample() {
  const envExample = `# Database Configuration
DB_TYPE=mysql              # mysql or postgres
DB_HOST=localhost
DB_PORT=3306              # 3306 for MySQL, 5432 for PostgreSQL
DB_USER=root              # root for MySQL, postgres for PostgreSQL
DB_PASSWORD=              # Your database password
DB_NAME=economic_engine

# Application Configuration
NODE_ENV=development
PORT=3000
SLAM_PORT=9999

# AI API Keys (replace with real keys)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_KEY=AIza...

# Stripe Configuration
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# External Data APIs
CRYPTO_API_KEY=your_crypto_api_key
ECONOMIC_DATA_KEY=your_economic_data_key

# Authentication
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here

# Cloud Deployment
RAILWAY_TOKEN=your_railway_token
VERCEL_TOKEN=your_vercel_token

# Agent Configuration
AGENT_WALLET_ADDRESS=0x1234567890abcdef1234567890abcdef12345678`;

  if (!fs.existsSync('.env.example')) {
    fs.writeFileSync('.env.example', envExample);
    console.log('📄 Created .env.example file');
  }
}

// Database connection class for the application
class DatabaseConnection {
  constructor() {
    this.pool = null;
    this.type = process.env.DB_TYPE || 'mysql';
  }

  async connect() {
    if (this.type === 'mysql') {
      this.pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'economic_engine',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
    } else if (this.type === 'postgres') {
      const { Pool } = require('pg');
      this.pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'economic_engine',
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
    }
    
    return this.pool;
  }

  async query(sql, params) {
    if (this.type === 'mysql') {
      const [results] = await this.pool.execute(sql, params);
      return results;
    } else {
      const result = await this.pool.query(sql, params);
      return result.rows;
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
    }
  }
}

// Run initialization if called directly
if (require.main === module) {
  createEnvExample();
  const initializer = new DatabaseInitializer();
  initializer.init().catch(console.error);
}

module.exports = { DatabaseInitializer, DatabaseConnection };